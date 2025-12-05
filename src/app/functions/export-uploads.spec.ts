import { randomUUID } from 'node:crypto'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import { exportUploads } from '@/app/functions/export-uploads'
import { isRight, unwrapEither } from '@/infra/shared/either'
import * as upload from '@/infra/storage/upload-file-to-storage'
import { makeUpload } from '@/test/factories/make-upload'

describe('export uploads', () => {
  beforeAll(() => {
    vi.mock('@/infra/storage/upload-file-to-storage', () => {
      return {
        uploadFileToStorage: vi.fn().mockImplementation(() => {
          return {
            key: `${randomUUID()}.jpg`,
            url: 'https://storage.com/image.jpg',
          }
        }),
      }
    })
  })

  it('should be able to export uploads', async () => {
    const uploadStub = vi
      .spyOn(upload, 'uploadFileToStorage')
      .mockImplementationOnce(async () => {
        return {
          key: `${randomUUID()}.csv`,
          url: 'http://example.com/file.csv',
        }
      })
    const namePattern = randomUUID()

    const upload1 = await makeUpload({ name: `${namePattern}.wep` })
    const upload2 = await makeUpload({ name: `${namePattern}.wep` })
    const upload3 = await makeUpload({ name: `${namePattern}.wep` })
    const upload4 = await makeUpload({ name: `${namePattern}.wep` })
    const upload5 = await makeUpload({ name: `${namePattern}.wep` })

    const sut = await exportUploads({
      searchQuery: namePattern,
    })

    const generatedCSVStream = uploadStub.mock.calls[0][0].contentStream

    const csvAsString = await new Promise<string>((resolve, reject) => {
      const chunks: Buffer[] = []
      generatedCSVStream.on('data', chunk => {
        chunks.push(chunk)
      })

      generatedCSVStream.on('end', () => {
        resolve(Buffer.concat(chunks).toString('utf-8'))
      })
      generatedCSVStream.on('error', err => {
        reject(err)
      })
    })

    const csvAsArray = csvAsString
      .trim()
      .split('\n')
      .map(row => row.split(','))
    console.log(csvAsArray)
    expect(isRight(sut)).toBe(true)
    expect(unwrapEither(sut)).toEqual({
      reportUrl: 'http://example.com/file.csv',
    })
    expect(csvAsArray).toEqual([
      ['ID', 'Name', 'URL', 'Uploaded at'],
      [upload1.id, upload1.name, upload1.remoteUrl, expect.any(String)],
      [upload2.id, upload2.name, upload2.remoteUrl, expect.any(String)],
      [upload3.id, upload3.name, upload3.remoteUrl, expect.any(String)],
      [upload4.id, upload4.name, upload4.remoteUrl, expect.any(String)],
      [upload5.id, upload5.name, upload5.remoteUrl, expect.any(String)],
    ])
  })
})
