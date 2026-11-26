// Wraps app.html (artifact page body) into a standalone index.html for GitHub Pages.
import {readFileSync, writeFileSync} from "node:fs";
const src = readFileSync(new URL("./app.html", import.meta.url), "utf8");
const cut = src.indexOf("</style>") + "</style>".length;
const head = src.slice(0, cut), body = src.slice(cut);
writeFileSync(new URL("./index.html", import.meta.url),
`<!doctype html>
<html lang="th">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#15301F">
<style>:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0}img{max-width:100%}[hidden]{display:none!important}</style>
${head}
</head>
<body>${body}
</body>
</html>
`);
console.log("built index.html");
