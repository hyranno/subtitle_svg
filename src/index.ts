import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import * as path from 'node:path';

import { createSVGWindow } from 'svgdom';
import { registerWindow, SVG, Dom, Text, Element } from '@svgdotjs/svg.js';

let window = createSVGWindow();
let document = window.document;
registerWindow(window, document);

function* idGen(): Generator<number, never, never> {
  for (var i=0; true; i++) {
    yield i;
  }
}
let idItr = idGen();


enum Style {
  None = "None",
}
interface Subtitle {
  actor: string,
  file: string,
  text: string,
  style: Style,
}
type InputList = {
  clips: Subtitle[],
};

interface ActorSetting {
  color: string,
}
type ActorSettingMap = {[actor: string]: ActorSetting};


function main() {
  let [,, input, actorSettingFile, dest] = process.argv;
  if (!dest) {
    console.log("node aclip_merge <inputFile> <actorSettingFile> <destDir>");
    process.exit(0);
  }

  let actorSettings = loadActorSettings(actorSettingFile);
  loadSubtitles(input).forEach(sub => {
    let svg = generateSvg(sub, actorSettings);
    saveSvg(svg, sub, dest);
  });
}


function generateSvg(sub: Subtitle, actorSettings: ActorSettingMap): Dom {
  let draw = SVG(document.documentElement);
  let container = SVG("<g />").attr("stroke", "none").transform({translate: [80, 40]});
  let setting = actorSettings[sub.actor];
  let text = new Text().text(sub.text).scale(4);
  let elems = [
    generateDilatedText(text.clone(), "#000", 2.0),
    generateDilatedText(text.clone(), setting.color, 1.5),
    generateDilatedText(text.clone(), "#fff", 1.0),
    text.fill(setting.color),
  ].flat();
  elems.forEach(elem => container.add(elem));
  return draw.add(container);
}

function generateDilatedText(text: Text, color: string, radius: number): Element[] {
  let filter = generateDilateFilter(radius);
  let textElem = text.fill(color).attr("filter", `url(#${filter.id()})`);
  return [textElem, filter];
}

function generateDilateFilter(radius: number): Element {
  let filterId = "filter" + idItr.next().value;
  let filter = SVG("<filter />").id(filterId);
  let dilation = SVG("<feMorphology />").attr("operator", "dilate").attr("radius", radius);
  filter.add(dilation);
  return filter;
}

function loadSubtitles(filepath: string): Subtitle[] {
  let data = JSON.parse(readFileSync(filepath, "utf8")) as InputList;
  return data.clips;
}
function loadActorSettings(filepath: string): ActorSettingMap {
  return JSON.parse(readFileSync(filepath, "utf8")) as ActorSettingMap;
}
function saveSvg(data: Dom, sub: Subtitle, dest: string) {  
  let dir = path.join(dest, path.dirname(sub.file));
  mkdirSync(dir, {recursive:true});
  let filepath = path.join(dir, path.basename(sub.file, path.extname(sub.file)) + ".svg");
  writeFileSync(filepath, data.svg());
}


main();