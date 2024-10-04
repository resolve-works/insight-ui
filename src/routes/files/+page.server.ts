
import type {Actions} from './$types';
import {create_folder, remove} from './';

export const actions = {
    create_folder,
    remove,
} satisfies Actions;
