<template>
  <div class="mod-erp-driver">
    <el-form :inline="true" :model="queryForm">
      <el-form-item>
        <el-input
          v-model="queryForm.keyword"
          placeholder="司机姓名/车牌号/手机号/身份证号"
          clearable
          @keyup.enter.native="searchHandle()">
        </el-input>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="searchHandle()">查询</el-button>
        <el-button v-if="isAuth('erp:driver:save')" type="success" @click="addOrUpdateHandle()">新增</el-button>
        <el-button
          v-if="isAuth('erp:driver:delete')"
          type="danger"
          :disabled="dataListSelections.length === 0"
          :loading="deleteLoading"
          @click="deleteHandle()">
          批量删除
        </el-button>
      </el-form-item>
    </el-form>

    <el-table
      :data="dataList"
      border
      stripe
      v-loading="dataListLoading"
      @selection-change="selectionChangeHandle">
      <el-table-column type="selection" width="50" align="center" header-align="center"></el-table-column>
      <el-table-column type="index" label="序号" width="70" align="center" header-align="center"></el-table-column>
      <el-table-column prop="driverName" label="司机姓名" min-width="160" show-overflow-tooltip></el-table-column>
      <el-table-column prop="plateNo" label="车牌号" min-width="160" align="center" header-align="center"></el-table-column>
      <el-table-column prop="mobile" label="手机号" min-width="160" align="center" header-align="center"></el-table-column>
      <el-table-column prop="idCardNo" label="身份证号" min-width="190" align="center" header-align="center" show-overflow-tooltip></el-table-column>
      <el-table-column label="状态" width="90" align="center" header-align="center">
        <template slot-scope="scope">
          <el-tag size="small" :type="scope.row.status === 1 ? 'success' : 'info'">
            {{ scope.row.status === 1 ? '启用' : '停用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column fixed="right" label="操作" width="130" align="center" header-align="center">
        <template slot-scope="scope">
          <el-button v-if="isAuth('erp:driver:update')" type="text" size="small" @click="addOrUpdateHandle(scope.row.id)">修改</el-button>
          <el-button v-if="isAuth('erp:driver:delete')" type="text" size="small" @click="deleteHandle(scope.row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      :current-page="pageIndex"
      :page-sizes="[10, 20, 50, 100]"
      :page-size="pageSize"
      :total="totalPage"
      layout="total, sizes, prev, pager, next, jumper"
      @size-change="sizeChangeHandle"
      @current-change="currentChangeHandle">
    </el-pagination>

    <add-or-update
      v-if="addOrUpdateVisible"
      ref="addOrUpdate"
      @refreshDataList="getDataList">
    </add-or-update>
  </div>
</template>

<script>
  import AddOrUpdate from './driver-add-or-update'

  export default {
    components: {
      AddOrUpdate
    },
    data () {
      return {
        queryForm: {
          keyword: ''
        },
        dataList: [],
        pageIndex: 1,
        pageSize: 10,
        totalPage: 0,
        dataListLoading: false,
        dataListSelections: [],
        addOrUpdateVisible: false,
        deleteLoading: false
      }
    },
    activated () {
      this.getDataList()
    },
    methods: {
      searchHandle () {
        this.pageIndex = 1
        this.getDataList()
      },
      getDataList () {
        this.dataListLoading = true
        this.$http({
          url: this.$http.adornUrl('/erp/driver/list'),
          method: 'get',
          params: this.$http.adornParams({
            page: this.pageIndex,
            limit: this.pageSize,
            keyword: this.queryForm.keyword
          })
        }).then(({data}) => {
          if (data && data.code === 0) {
            this.dataList = data.page.list
            this.totalPage = data.page.totalCount
          } else {
            this.dataList = []
            this.totalPage = 0
            this.$message.error(data.msg || '获取司机信息失败')
          }
        }).finally(() => {
          this.dataListLoading = false
        })
      },
      sizeChangeHandle (val) {
        this.pageSize = val
        this.pageIndex = 1
        this.getDataList()
      },
      currentChangeHandle (val) {
        this.pageIndex = val
        this.getDataList()
      },
      selectionChangeHandle (val) {
        this.dataListSelections = val
      },
      addOrUpdateHandle (id) {
        this.addOrUpdateVisible = true
        this.$nextTick(() => {
          this.$refs.addOrUpdate.init(id)
        })
      },
      deleteHandle (id) {
        const ids = id ? [id] : this.dataListSelections.map(item => item.id)
        this.$confirm('确定删除选中的司机信息吗？', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }).then(() => {
          this.deleteLoading = true
          return this.$http({
            url: this.$http.adornUrl('/erp/driver/delete'),
            method: 'post',
            data: this.$http.adornData(ids, false)
          })
        }).then(({data}) => {
          if (data && data.code === 0) {
            this.$message.success('删除成功')
            this.getDataList()
          } else {
            this.$message.error(data.msg || '删除失败')
          }
        }).catch(() => {
          // 用户取消删除时无需提示。
        }).finally(() => {
          this.deleteLoading = false
        })
      }
    }
  }
</script>

<style scoped>
  .mod-erp-driver .el-pagination {
    margin-top: 15px;
    text-align: right;
  }
</style>
