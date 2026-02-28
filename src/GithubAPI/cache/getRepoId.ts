import { graphql } from '../graphql'
import { cache } from './cache'

export async function getRepoId({
  owner,
  name,
}: { owner: string; name: string }) {
  const key = `repo:${owner}/${name}`
  const cacheId = cache.getId(key)
  if (cacheId) return cacheId

  const { repository } = await graphql<any>(
    `
  query ($owner: String!, $name: String!) {
    repository(owner: $owner, name: $name) {
      id
    }
  }
`,
    { owner, name },
  )

  const id = repository.id
  cache.setId(key, id)
  return id
}
