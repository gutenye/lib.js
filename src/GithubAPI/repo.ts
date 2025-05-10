import { graphql } from './graphql'

export async function getRepo({
  owner,
  name,
}: { owner: string; name: string }) {
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

  return repository
}
