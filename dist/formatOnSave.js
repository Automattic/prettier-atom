'use strict';

var _require = require('./executePrettier'),
    executePrettierOnBufferRange = _require.executePrettierOnBufferRange,
    executePrettierOnEmbeddedScripts = _require.executePrettierOnEmbeddedScripts;

var _require2 = require('./helpers'),
    shouldRespectEslintignore = _require2.shouldRespectEslintignore,
    isFormatOnSaveEnabled = _require2.isFormatOnSaveEnabled,
    getCurrentFilePath = _require2.getCurrentFilePath,
    isCurrentScopeEmbeddedScope = _require2.isCurrentScopeEmbeddedScope,
    isFilePathEslintignored = _require2.isFilePathEslintignored,
    isInScope = _require2.isInScope;

var formatOnSaveIfAppropriate = function formatOnSaveIfAppropriate(editor) {
  var filePath = getCurrentFilePath(editor);

  if (!isFormatOnSaveEnabled()) return;
  if (!isInScope(editor)) return;
  if (filePath && shouldRespectEslintignore() && isFilePathEslintignored(filePath)) return;

  if (isCurrentScopeEmbeddedScope(editor)) {
    executePrettierOnEmbeddedScripts(editor);
  } else {
    executePrettierOnBufferRange(editor, editor.getBuffer().getRange());
  }
};

module.exports = formatOnSaveIfAppropriate;