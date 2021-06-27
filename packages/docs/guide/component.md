# 在组件中引入
```vue
<template>
<div>
    <h1>用户信息查询</h1>
    <ul>
        <li v-for="id in userIdList">
            用户ID：{{id}}
            <input type="button" value="查询" @click="searchUser(id)">
        </li>
    </ul>
    <section>
        <h2>用户信息</h2>
        <p>姓名：{{userInfo.name}}<p>
        <p>性别：{{userInfo.sex}}<p>
        <p>描述：{{userInfo.description}}<p>
        <button >刷新用户信息</button>
    </section>
</div>
</template>
<script lang="ts">
import ProfileModel from './profile-model';
import { defineComponent, reactive, toRefs, computed } from '@vue/composition-api';
import { useApolloModel } from 'vue-apollo-model';

export default defineComponent({
    setup() {
        const state = reactive({
            userIdList: [1, 2, 3, 4],
        });
        const profileModel = useApolloModel(ProfileModel);
        const userInfo = computed(() => profileModel.userInfo);
        function searchUser(id: string;) {
            profileModel.id = id;
        }
        return {
            ...toRefs(state),
            userInfo,
            searchUser,
        };
    },
});
</script>
```
