#!/usr/bin/env node
import { createVantaCli } from "./domains/vanta/runtime/cli.js";
await createVantaCli().parseAsync(process.argv);
