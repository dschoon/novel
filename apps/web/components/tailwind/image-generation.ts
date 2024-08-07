import { Editor, Range } from "@tiptap/core";

export async function generateImage(editor: Editor, range: Range) {
  const { from, to } = range;
  const text = editor.state.doc.textBetween(from, to, ' ');

  editor.chain().focus().deleteRange(range).run();

  const loadingPlaceholder = document.createElement('div');
  loadingPlaceholder.textContent = 'Generating image...';
  loadingPlaceholder.className = 'image-placeholder';
  
  editor.view.dispatch(editor.view.state.tr.insert(from, editor.schema.text(' ')));
  editor.view.dispatch(editor.view.state.tr.setMeta('addNodeView', {
    pos: from,
    node: loadingPlaceholder,
  }));

  try {
    const response = await fetch('/api/generate-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: text }),
    });

    if (!response.ok) {
      throw new Error('Failed to generate image');
    }

    const { imageUrl } = await response.json();

    editor.chain().focus().setImage({ src: imageUrl }).run();
  } catch (error) {
    console.error('Error generating image:', error);
    editor.chain().focus().deleteRange({ from, to: from + 1 }).run();
  } finally {
    editor.view.dispatch(editor.view.state.tr.setMeta('removeNodeView', { pos: from }));
  }
}