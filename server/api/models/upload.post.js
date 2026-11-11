// Gives the admin's browser a short-lived permit to upload ONE .glb file straight to Vercel Blob (the file does not pass through this server).
import { createError, defineEventHandler, readBody, toWebRequest } from 'h3'
import { handleUpload } from '@vercel/blob/client'
import { requireAdmin } from '../../utils/auth.js'
import { MAX_MB } from '../../utils/models.js'

export default defineEventHandler(async event => {
  const body = await readBody(event)
  if (body?.type !== 'blob.upload-completed') await requireAdmin(event) // the "upload finished" call comes from Vercel and is checked by its signature
  if (!process.env.BLOB_READ_WRITE_TOKEN) throw createError({ statusCode: 500, statusMessage: 'BLOB_READ_WRITE_TOKEN is not set in the .env of the admin.' })
  try {
    return await handleUpload({
      body,
      request: toWebRequest(event),
      onBeforeGenerateToken: async pathname => {
        await requireAdmin(event) // only a signed-in admin gets a permit
        if (!/^models\/[\w.-]+\.glb$/i.test(pathname)) throw createError({ statusCode: 400, statusMessage: 'Only .glb files are allowed.' })
        return { allowedContentTypes: ['model/gltf-binary'], maximumSizeInBytes: MAX_MB * 1024 * 1024, addRandomSuffix: true }
      },
      onUploadCompleted: async () => {} // nothing to do: the page saves the model after the upload
    })
  } catch (e) {
    if (e?.statusCode) throw e
    throw createError({ statusCode: 400, statusMessage: 'The upload was refused.' })
  }
})
