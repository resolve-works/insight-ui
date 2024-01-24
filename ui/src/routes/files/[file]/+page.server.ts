
import sign from '$lib/sign.ts';

export async function load({ params, fetch, locals }) {
    const { access_token } = locals;

    const res = await fetch(`/api/v1/file?id=eq.${params.file}`, {
        headers: { Authorization: `Bearer ${access_token}` }
    })
    const files = await res.json();
    const file = files[0]

    return {
        ...file,
        url: sign(file.path, locals),
    }
}