
import { load_files, load_folders } from '$lib/uploads';

export async function load(event) {
    event.depends('api:files')
    event.depends('api:folders')

    const folder_id = event.params.id;

    return {
        ...await load_files(event, folder_id),
        ...await load_folders(event, folder_id)
    } 
}
