import * as core from '@actions/core';
import { main } from './index.js';
main().catch(error => core.setFailed(error instanceof Error ? error.message : String(error)));
