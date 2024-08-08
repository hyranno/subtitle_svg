
import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import * as path from 'node:path';

import { createSVGWindow } from 'svgdom'
import { SVG, registerWindow, Dom } from '@svgdotjs/svg.js'
let window = createSVGWindow()
let document = window.document
registerWindow(window, document)


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
}

interface ActorSetting {
  color: string,
}
type ActorSettingMap = {[actor: string]: ActorSetting}


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
  return draw;
}

function loadSubtitles(filepath: string): Subtitle[] {
  let data = JSON.parse(readFileSync(filepath, "utf8")) as InputList;
  return data.clips
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