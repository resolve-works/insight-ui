
import type {Actions} from './$types';
import {create_folder, upload, remove} from './';

export const actions = {
    create_folder,
    upload,
    remove,
} satisfies Actions;
