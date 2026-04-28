const path = require("path");
const projectRoot = path.resolve(__dirname);

module.exports = function ({ types: t }) {
  return {
    visitor: {
      JSXOpeningElement(nodePath, state) {
        const loc = nodePath.node.loc;
        if (!loc) return;

        const filePath = state.filename
          ? path.relative(projectRoot, state.filename)
          : null;
        if (!filePath) return;

        nodePath.node.attributes.push(
          t.jsxAttribute(
            t.jsxIdentifier("data-source"),
            t.stringLiteral(`${filePath}:${loc.start.line}`)
          )
        );
      },
    },
  };
};
