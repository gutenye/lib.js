import { graphql as graphqlBase } from '@octokit/graphql'

const { GITHUB_TOKEN } = process.env

export const graphql = graphqlBase.defaults({
	headers: {
		Authorization: `Bearer ${GITHUB_TOKEN}`,
	},
})

