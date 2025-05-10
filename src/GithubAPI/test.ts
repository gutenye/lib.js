#!/usr/bin/env bun

import { getRepo } from './index'

console.log(await getRepo({ owner: 'gutenye', name: 'hello' }))
