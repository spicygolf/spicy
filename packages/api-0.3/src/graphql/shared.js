export const SharedTypeDefs = `

input Pagination {
  page: Int!
  perPage: Int!
}

type Response {
  success : Boolean
  _key: String
  message: String
}

`;
