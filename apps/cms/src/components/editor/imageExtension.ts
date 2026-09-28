import ImageExtension from '@tiptap/extension-image';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { ImageNodeView } from './ImageNodeView.js';

const attribute = { default: null, rendered: false };

/**
 * The stock image node plus the framing an article needs: which library
 * picture it is, how wide, where it sits and which part of it shows. The
 * extra attributes are not written into pasted or copied HTML, only into the
 * document JSON the API stores.
 */
export const FramedImage = ImageExtension.extend({
  addAttributes() {
    return {
      src: { default: null },
      alt: { default: null },
      title: { default: null },
      mediaId: attribute,
      widthPercent: attribute,
      placement: attribute,
      crop: attribute,
      naturalWidth: attribute,
      naturalHeight: attribute,
    };
  },

  addNodeView() {
    // The resize handles and the caption box are the picture's own controls:
    // without this the editor takes their clicks and keystrokes for itself.
    return ReactNodeViewRenderer(ImageNodeView, {
      stopEvent: ({ event }) =>
        event.target instanceof Element &&
        event.target.closest('[data-image-control]') !== null,
    });
  },
});
