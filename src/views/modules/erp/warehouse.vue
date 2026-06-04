<template>
  <div class="mod-erp-warehouse">
    <el-form :inline="true" :model="queryForm">
      <el-form-item>
        <el-input v-model="queryForm.keyword" placeholder="仓库编码/名称/地址" clearable @keyup.enter.native="getDataList()"></el-input>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="getDataList()">查询</el-button>
        <el-button v-if="isAuth('erp:warehouse:save')" type="success" @click="addOrUpdateHandle()">新增</el-button>
        <el-button v-if="isAuth('erp:warehouse:delete')" type="danger" :disabled="dataListSelections.length <= 0" @click="deleteHandle()">批量删除</el-button>
      </el-form-item>
    </el-form>

    <el-table :data="dataList" border stripe v-loading="dataListLoading" @selection-change="selectionChangeHandle">
      <el-table-column type="selection" width="50" align="center" header-align="center"></el-table-column>
      <el-table-column prop="warehouseCode" label="仓库编码" min-width="120" align="center" header-align="center"></el-table-column>
      <el-table-column prop="warehouseName" label="仓库名称" min-width="180" show-overflow-tooltip></el-table-column>
      <el-table-column prop="warehouseType" label="类型" width="120" align="center" header-align="center"></el-table-column>
      <el-table-column prop="freeStorageDays" label="免仓天数" width="100" align="right" header-align="center"></el-table-column>
      <el-table-column prop="frozenStorageFee" label="仓储冷冻(元/吨)" width="130" align="right" header-align="center"></el-table-column>
      <el-table-column prop="chilledStorageFee" label="仓储冷藏(元/吨)" width="130" align="right" header-align="center"></el-table-column>
      <el-table-column prop="frozenColdFee" label="冷链冷冻装卸费(元/吨)" width="170" align="right" header-align="center"></el-table-column>
      <el-table-column prop="chilledColdFee" label="冷链冷藏装卸费(元/吨)" width="170" align="right" header-align="center"></el-table-column>
      <el-table-column prop="feeUnit" label="计费单位" width="100" align="center" header-align="center"></el-table-column>
      <el-table-column prop="contactName" label="联系人" width="100" align="center" header-align="center"></el-table-column>
      <el-table-column prop="contactPhone" label="联系电话" width="130" align="center" header-align="center"></el-table-column>
      <el-table-column label="状态" width="80" align="center" header-align="center">
        <template slot-scope="scope">
          <el-tag size="small" :type="scope.row.status === 1 ? 'success' : 'info'">{{ scope.row.status === 1 ? '启用' : '停用' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column fixed="right" label="操作" width="210" align="center" header-align="center">
        <template slot-scope="scope">
          <el-button v-if="isAuth('erp:warehouse:update')" type="text" size="small" @click="addOrUpdateHandle(scope.row.id)">修改</el-button>
          <el-button v-if="isAuth('erp:warehouse:update')" type="text" size="small" @click="feeRateHandle(scope.row)">费用历史</el-button>
          <el-button v-if="isAuth('erp:warehouse:delete')" type="text" size="small" @click="deleteHandle(scope.row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      @size-change="sizeChangeHandle"
      @current-change="currentChangeHandle"
      :current-page="pageIndex"
      :page-sizes="[10, 20, 50, 100]"
      :page-size="pageSize"
      :total="totalPage"
      layout="total, sizes, prev, pager, next, jumper">
    </el-pagination>

    <add-or-update v-if="addOrUpdateVisible" ref="addOrUpdate" @refreshDataList="getDataList"></add-or-update>
    <fee-rate-dialog v-if="feeRateVisible" ref="feeRateDialog" @refreshDataList="getDataList"></fee-rate-dialog>
  </div>
</template>

<script>
  import AddOrUpdate from './warehouse-add-or-update'
  import FeeRateDialog from './warehouse-fee-rate-dialog'

  export default {
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
        feeRateVisible: false
      }
    },
    components: {
      AddOrUpdate,
      FeeRateDialog
    },
    activated () {
      this.getDataList()
    },
    methods: {
      getDataList () {
        this.dataListLoading = true
        this.$http({
          url: this.$http.adornUrl('/erp/warehouse/list'),
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
            this.$message.error(data.msg || '获取数据失败')
          }
          this.dataListLoading = false
        }).catch(() => {
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
      feeRateHandle (row) {
        this.feeRateVisible = true
        this.$nextTick(() => {
          this.$refs.feeRateDialog.init(row)
        })
      },
      deleteHandle (id) {
        const ids = id ? [id] : this.dataListSelections.map(item => item.id)
        this.$confirm(`确定对[id=${ids.join(',')}]进行删除操作?`, '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }).then(() => {
          this.$http({
            url: this.$http.adornUrl('/erp/warehouse/delete'),
            method: 'post',
            data: this.$http.adornData(ids, false)
          }).then(({data}) => {
            if (data && data.code === 0) {
              this.$message({
                message: '操作成功',
                type: 'success',
                duration: 1500,
                onClose: () => {
                  this.getDataList()
                }
              })
            } else {
              this.$message.error(data.msg || '删除失败')
            }
          })
        }).catch(() => {})
      }
    }
  }
</script>

<style scoped>
  .mod-erp-warehouse .el-pagination {
    margin-top: 15px;
    text-align: right;
  }
</style>
