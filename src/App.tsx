import * as React from "react";
// import "./styles.css";

import "prosemirror-view/style/prosemirror.css";

import { EditorState, TextSelection } from "prosemirror-state";
import { EditorView } from "prosemirror-view";

import { DOMParser, Schema } from "prosemirror-model";
import { placeholder as prosePlaceholder } from "@aeaton/prosemirror-placeholder";
import { schema } from "prosemirror-schema-basic";
// import { findParentNode } from "prosemirror-utils";
// import { exampleSetup } from "prosemirror-example-setup";

type Range = {
  readonly from: number;
  readonly to: number;
};

type Selection = null | Range;

type TokenFieldProps = {
  readonly value: string;
  readonly selection: Selection;
  readonly onChange: (value: string, range: Range) => void;
};

const trivialSchema = new Schema({
  nodes: {
    // :: NodeSpec The top level document node.
    doc: {
      content: "block+"
    },

    // :: NodeSpec A plain paragraph textblock. Represented in the DOM
    // as a `<p>` element.
    paragraph: {
      content: "inline*",
      group: "block",
      parseDOM: [{ tag: "p" }],
      code: true,
      toDOM() {
        return ["p", 0];
      }
    },

    // :: NodeSpec The text node.
    text: {
      group: "inline",
      code: true
    }
    /* ... and so on */
  }
});
const TokenField: React.FC<TokenFieldProps> = ({
  value,
  selection,
  onChange
}) => {
  const ref = React.useRef<HTMLDivElement>(null);
  const [editor, setEditorView] = React.useState<EditorView>();

  React.useEffect(() => {
    if (!ref.current) {
      return;
    }

    let startDoc = DOMParser.fromSchema(schema).parse(ref.current);

    let state = EditorState.create({
      doc: startDoc,
      plugins: [
        prosePlaceholder({
          content: "Hello world..."
        })
      ]
    });

    const newEditor = new EditorView(ref.current, {
      state,

      dispatchTransaction(transaction) {
        onChange(this.state.apply(transaction).doc.textContent, {
          from: transaction.selection.$from.pos - 2,
          to: transaction.selection.$to.pos - 2
        });
      }
    });

    setEditorView(newEditor);
  }, []);

  React.useEffect(() => {
    if (!editor) {
      return;
    }

    const tr = editor.state.tr;

    tr.insertText(value, 0, tr.doc.content.size);
    // tr.setSelection(TextSelection.create(tr.doc, 0, tr.doc.content.size));

    if (selection) {
      tr.setSelection(
        TextSelection.create(tr.doc, selection.from + 2, selection.to + 2)
      );
    }
    // }

    // const newTextNode = trivialSchema.nodes.paragraph.create(
    //   null,
    //   trivialSchema.text(value || " ")
    // );

    // if (newTextNode) {
    //   tr.replaceWith(0, tr.doc.content.size, newTextNode);
    //   // console.log(tr.doc);
    // }

    // if (selection) {
    //   // const textNode = tr.doc.nodeAt(0);

    //   const textNode = tr.doc.nodeAt(1);

    //   if (textNode) {
    //     // const textParentPosition = Selection.atStart(tr.doc);

    // }

    editor.updateState(editor.state.apply(tr));
  }, [value, selection, editor]);

  // React.useEffect(() => {
  //   if (!editor || !selection) {
  //     return;
  //   }

  //   const tr = editor.state.tr;

  //   editor.updateState(editor.state.apply(tr));
  // }, [selection, editor]);

  return <div ref={ref} />;
};

export default function App() {
  const [v2, setV2] = React.useState({
    v: "",
    s: null as Selection
  });
  const [v, setV] = React.useState("");

  const MAX_LENGTH = 10000000;

  const onChange = React.useCallback((newValue, newSelection) => {
    if (newValue.length > MAX_LENGTH) {
      const sliced = newValue.slice(0, MAX_LENGTH);

      return setV2({
        s: {
          from: sliced.length - 1,
          to: sliced.length - 1
        },
        v: sliced
      });
    }

    setV2({
      s: newSelection,
      v: newValue
    });
  }, []);

  return (
    <div className="App">
      <textarea onChange={(e) => setV(e.target.value)} value={v} />
      <button
        onClick={() =>
          setV2({
            s: {
              from: 0,
              to: v.length - 1
            },
            v: v
          })
        }
      >
        update
      </button>
      <TokenField selection={v2.s} value={v2.v} onChange={onChange} />
    </div>
  );
}
