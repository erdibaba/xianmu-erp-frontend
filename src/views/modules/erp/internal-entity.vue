<template>
  <div class="mod-erp-internal-entity">
    <el-form :inline="true" :model="queryForm">
      <el-form-item>
        <el-input v-model="queryForm.keyword" clearable placeholder="主体编码/名称/简称" @keyup.enter.native="getDataList"></el-input>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="getDataList">查询</el-button>
        <el-button v-if="isAuth('erp:internalentity:save')" type="success" @click="addOrUpdateHandle()">新增</el-button>
      </el-form-item>
    </el-form>

    <el-table :data="dataList" border stripe v-loading="dataListLoading">
      <el-table-column prop="entityCode" label="主体编码" width="130" align="center"></el-table-column>
      <el-table-column prop="entityName" label="公司全称" min-width="230" show-overflow-tooltip></el-table-column>
      <el-table-column prop="shortName" label="简称" width="100" align="center"></el-table-column>
      <el-table-column label="默认主体" width="100" align="center">
        <template slot-scope="scope">
          <el-tag v-if="Number(scope.row.defaultFlag) === 1" size="small" type="success">是</el-tag>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column prop="bankAccountName" label="银行户名" min-width="200" show-overflow-tooltip></el-table-column>
      <el-table-column prop="bankName" label="开户行" min-width="220" show-overflow-tooltip></el-table-column>
      <el-table-column prop="bankAccount" label="银行账号" min-width="180" show-overflow-tooltip></el-table-column>
      <el-table-column label="合同配置" width="110" align="center">
        <template slot-scope="scope">
          <el-tag size="small" :type="scope.row.contractTemplatePath && scope.row.stampFilePath ? 'success' : 'warning'">
            {{ scope.row.contractTemplatePath && scope.row.stampFilePath ? '已配置' : '待配置' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="80" align="center">
        <template slot-scope="scope">
          <el-tag size="small" :type="Number(scope.row.status) === 1 ? 'success' : 'info'">
            {{ Number(scope.row.status) === 1 ? '启用' : '停用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column fixed="right" label="操作" width="140" align="center">
        <template slot-scope="scope">
          <el-button v-if="isAuth('erp:internalentity:update')" type="text" size="small" @click="addOrUpdateHandle(scope.row.id)">修改</el-button>
          <el-button v-if="isAuth('erp:internalentity:delete') && Number(scope.row.defaultFlag) !== 1" type="text" size="small" @click="deleteHandle(scope.row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      :current-page="pageIndex"
      :page-size="pageSize"
      :page-sizes="[10, 20, 50]"
      :total="totalPage"
      layout="total, sizes, prev, pager, next, jumper"
      @size-change="sizeChangeHandle"
      @current-change="currentChangeHandle">
    </el-pagination>

    <internal-entity-add-or-update
      v-if="dialogVisible"
      ref="internalEntityDialog"
      @refreshDataList="getDataList">
    </internal-entity-add-or-update>
  </div>
</template>

<script>
import InternalEntityAddOrUpdate from './internal-entity-add-or-update'

export default {
  components: { InternalEntityAddOrUpdate },
  data () {
    return {
      queryForm: { keyword: '' },
      dataList: [],
      dataListLoading: false,
      pageIndex: 1,
      pageSize: 10,
      totalPage: 0,
      dialogVisible: false
    }
  },
  activated () {
    this.getDataList()
  },
  methods: {
    getDataList () {
      this.dataListLoading = true
      this.$http({
        url: this.$http.adornUrl('/erp/internalentity/list'),
        method: 'get',
        params: this.$http.adornParams({
          page: this.pageIndex,
          limit: this.pageSize,
          keyword: this.queryForm.keyword
        })
      }).then(({ data }) => {
        if (data && data.code === 0) {
          this.dataList = data.page.list || []
          this.totalPage = data.page.totalCount || 0
        } else {
          this.dataList = []
          this.totalPage = 0
          this.$message.error((data && data.msg) || '获取内部主体失败')
        }
      }).finally(() => {
        this.dataListLoading = false
      })
    },
    sizeChangeHandle (value) {
      this.pageSize = value
      this.pageIndex = 1
      this.getDataList()
    },
    currentChangeHandle (value) {
      this.pageIndex = value
      this.getDataList()
    },
    addOrUpdateHandle (id) {
      this.dialogVisible = true
      this.$nextTick(() => this.$refs.internalEntityDialog.init(id))
    },
    deleteHandle (row) {
      this.$confirm(`确定删除内部主体“${row.entityName}”吗？`, '提示', { type: 'warning' }).then(() => {
        return this.$http({
          url: this.$http.adornUrl('/erp/internalentity/delete'),
          method: 'post',
          data: this.$http.adornData([row.id], false)
        })
      }).then(({ data }) => {
        if (data && data.code === 0) {
          this.$message.success('删除成功')
          this.getDataList()
        } else {
          this.$message.error((data && data.msg) || '删除失败')
        }
      }).catch(() => {})
    }
  }
}
</script>
