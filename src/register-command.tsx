import { BlockEntity } from "@logseq/libs/dist/LSPlugin";
import React from "react";
import ReactDOMServer from "react-dom/server";
import { UI, style } from "./ui";

const pluginId = "sidenote";
const macroPrefix = ":" + pluginId;

// @ts-expect-error
const css = (t, ...args) => String.raw(t, ...args);

async function render(slot: string, uuid: string, counter: number) {
  try {
    if (rendering.get(slot) !== uuid) {
      return;
    }
    const block = await logseq.Editor.getBlock(uuid);
    if (rendering.get(slot) !== uuid || !block) {
      return;
    }

    const template = ReactDOMServer.renderToStaticMarkup(
      <UI content={block.content} />
    );

    logseq.provideUI({
      key: pluginId,
      slot,
      reset: true,
      template: template,
    });

    return true;
  } catch (e: any) {
    console.error(e);
  }
}

const rendering = new Map<string, string>();

async function startRendering(slot: string, uuid: string) {
  rendering.set(slot, uuid);
  let counter = 0;
  while (await render(slot, uuid, counter++)) {
    // sleep for 3000ms
    await new Promise((resolve) => setTimeout(resolve, 3000));
  }
}

export function registerCommand() {
  logseq.provideStyle({
    key: pluginId,
    style,
  });

  logseq.App.onMacroRendererSlotted(async ({ payload, slot }) => {
    const [type, uuid] = payload.arguments;
    if (!type?.startsWith(macroPrefix)) {
      return;
    }

    startRendering(slot, uuid);
  });

  logseq.Editor.registerSlashCommand(
    "[Side Note] Add side note to current block",
    async () => {
      const block = await logseq.Editor.getCurrentBlock();
      const position = await logseq.Editor.getEditingCursorPosition();

      if (!block || !position) {
        return;
      }
      const noteBlock = await logseq.Editor.insertBlock(
        block.uuid,
        `<put-your-content-here>`
      );

      if (!noteBlock) {
        return; // ???
      }
      await logseq.Editor.editBlock(block.uuid, position);
      const content = ` {{renderer ${macroPrefix},${noteBlock.uuid}}}`;
      await logseq.Editor.insertAtEditingCursor(content);

      // logseq.Editor.editBlock(noteBlock.uuid);
    }
  );
}
