#!/usr/bin/env bun
import { $ } from "bun"

console.log("Start Bun Script!")

const resultText = await $`bun --version`.text()
console.log(`Bun version: ${resultText}`)
