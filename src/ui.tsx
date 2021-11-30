import React from "react";
import { marked } from "marked";

export const style: string = "";

export function UI({ content }: { content: string }) {
  return <div dangerouslySetInnerHTML={{ __html: marked(content) }}></div>;
}
