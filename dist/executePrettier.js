'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var prettierEslint = require('prettier-eslint');
var prettier = require('prettier');

var _require = require('loophole'),
    allowUnsafeNewFunction = _require.allowUnsafeNewFunction;

var _require2 = require('./helpers'),
    getPrettierOptions = _require2.getPrettierOptions,
    getPrettierEslintOptions = _require2.getPrettierEslintOptions,
    getCurrentFilePath = _require2.getCurrentFilePath,
    getLocalPrettierPath = _require2.getLocalPrettierPath,
    shouldDisplayErrors = _require2.shouldDisplayErrors,
    shouldUseEslint = _require2.shouldUseEslint,
    runLinter = _require2.runLinter;

var EMBEDDED_JS_REGEX = /<script\b[^>]*>([\s\S]*?)(?=<\/script>)/gi;

var displayError = function displayError(error) {
  atom.notifications.addError('prettier-atom failed!', {
    detail: error,
    stack: error.stack,
    dismissable: true
  });
};

var handleError = function handleError(error) {
  if (shouldDisplayErrors()) displayError(error);
  return false;
};

// charypar: This is currently the best way to use local prettier instance.
// Using the CLI introduces a noticeable delay and there is currently no
// way to use prettier as a long-running process for formatting files as needed
//
// See https://github.com/prettier/prettier/issues/918
//
// $FlowFixMe when possible, don't use dynamic require
var getLocalPrettier = function getLocalPrettier(path) {
  return require(path);
}; // eslint-disable-line

var executePrettier = function executePrettier(editor, text) {
  try {
    if (shouldUseEslint()) {
      return allowUnsafeNewFunction(function () {
        return prettierEslint(_extends({}, getPrettierEslintOptions(), {
          text: text,
          filePath: getCurrentFilePath(editor)
        }));
      });
    }

    var prettierOptions = getPrettierOptions(editor);
    var localPrettier = getLocalPrettierPath(getCurrentFilePath(editor));

    if (!localPrettier) {
      return prettier.format(text, prettierOptions);
    }

    return getLocalPrettier(localPrettier).format(text, prettierOptions);
  } catch (error) {
    return handleError(error);
  }
};

var executePrettierOnBufferRange = function executePrettierOnBufferRange(editor, bufferRange) {
  var cursorPositionPriorToFormat = editor.getCursorScreenPosition();
  var textToTransform = editor.getTextInBufferRange(bufferRange);
  var transformed = executePrettier(editor, textToTransform);

  var isTextUnchanged = transformed === textToTransform;
  if (!transformed || isTextUnchanged) return;

  editor.setTextInBufferRange(bufferRange, transformed);
  editor.setCursorScreenPosition(cursorPositionPriorToFormat);
  runLinter(editor);
};

var executePrettierOnEmbeddedScripts = function executePrettierOnEmbeddedScripts(editor) {
  return editor.backwardsScanInBufferRange(EMBEDDED_JS_REGEX, editor.getBuffer().getRange(), function (iter) {
    // Create new range with start row advanced by 1,
    // since we cannot use look-behind on variable-length starting
    // <script ...> tag
    var _iter$range = iter.range,
        start = _iter$range.start,
        end = _iter$range.end;

    var startModified = [start.row + 1, start.column];
    var bufferRange = new iter.range.constructor(startModified, end);

    executePrettierOnBufferRange(editor, bufferRange);
  });
};

module.exports = {
  executePrettierOnBufferRange: executePrettierOnBufferRange,
  executePrettierOnEmbeddedScripts: executePrettierOnEmbeddedScripts
};