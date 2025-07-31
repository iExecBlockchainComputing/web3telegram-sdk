export type ProtectedDataQuery = {
  id: string;
  name: string;
};

export type GraphQLResponse = {
  protectedDatas: ProtectedDataQuery[];
};
