# Model

## 定义Model

```typescript
import {
    BaseModel,
    apolloQuery,
    QueryResult,
    apolloMutation,
    MutationResult,
    restQuery,
    restMutation,
} from 'vue-apollo-model';
import gql from 'graphql-tag';

export default class ProfileModel extends BaseModel {
    id = '';
    @apolloQuery<ProfileModel>({
        query: gql`
            query userInfo($id: String) {
                userInfo(id: $id) {
                    name
                    description
                    sex
                }
            }
        `,
        prefetch: true,
        skip() {
            return !this.id;
        },
        variables($route) {
            return {
                id: $route.params.od
            };
        },
    })
    private userInfoQuery!: QueryResult<{
        userInfo: {
            name: string;
            description: string;
            sex: 'male' | 'female' | '';
        }
    }>;

    get userInfo() {
        return this.userInfoQuery.data.userInfo;
    }

    @apolloMutation<ProfileModel>({
        mutation: gql`
            mutation commit($data: String) {
                commit(data: $data) {
                    result
                }
            }
        `,
        variables({ data }: CommitParams) {
            return {
                data,
            };
        },
    })
    private feedbackMutation!: MutationResult<CommitParams, {
        sendFeedback: {
            result: number;
        };
    }>;

    async sendFeedback(commitParams: CommitParams) {
        await this.feedbackMutation.mutate(commitParams);
    }

    @restQuery<ProfileModel>({
        url: '/rest/wd/sf2021/flychess/user/info',
        method: 'GET',
    })
    private currentUserQuery!: QueryResult<{
        score?: number;
        userName?: string;
        headUrl?: string;
        userId: string | number;
    }>

    get userName() {
        return this.currentUserQuery.data.userName;
    }

    @restMutation<ProfileModel>({
        url: '/rest/user/save',
        method: 'POST',
        variables(params) {
            return params;
        },
    })
    private saveUserMutation!: MutationResult<{
        id: string;
    }, {
        result: number;
        power: number;
        score: number;
    }>

    async chooseUser(id: string) {
        await this.saveUserMutation.mutate({
            id,
        });
        const { result } = this.saveUserMutation.error;
        return result === 1;
    }
}
```

## BaseModel
每一个VueApolloModel构造函数都应继承自BaseModel，BaseModel上定义了一系列属性与方法，具体参见[BaseModel](../api/base-model.md)

## apolloQuery
定义一个query查询，具体参见[apolloQuery](../api/apollo-query.md)

## apolloMutation
定义一个query查询，具体参见[apolloMutation](../api/apollo-mutation.md)

## restQuery
定义一个query查询，具体参见[restQuery](../api/rest-query.md)

## restMutation
定义一个query查询，具体参见[restMutation](../api/rest-mutation.md)