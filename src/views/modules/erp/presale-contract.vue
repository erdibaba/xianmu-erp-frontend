<template>
  <div class="mod-erp-presale-contract">
    <el-alert
      title="预售单管理只维护品牌方大预售合同。客户订单确认函、装箱单、报关单、检疫证明请到“客户订单确认”菜单按小合同处理。"
      type="info"
      :closable="false"
      show-icon>
    </el-alert>

    <el-form :inline="true" :model="queryForm" class="query-form">
      <el-form-item>
        <el-input
          v-model="queryForm.keyword"
          placeholder="预售单号 / 预售合同号 / 采购方"
          clearable
          @keyup.enter.native="getDataList()">
        </el-input>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="getDataList()">查询</el-button>
        <el-button
          v-if="isAuth('erp:tradeorder:save')"
          type="success"
          @click="uploadEstimateHandle()">上传预售单</el-button>
      </el-form-item>
    </el-form>

    <el-table :data="dataList" border stripe v-loading="dataListLoading" class="main-table">
      <el-table-column prop="orderNo" label="预售单号" min-width="150" align="center"></el-table-column>
      <el-table-column prop="sellerContractNo" label="预售合同号" min-width="170" show-overflow-tooltip></el-table-column>
      <el-table-column prop="customerReference" label="采购方" min-width="200" show-overflow-tooltip></el-table-column>
      <el-table-column prop="brandName" label="品牌方" min-width="180" show-overflow-tooltip></el-table-column>
      <el-table-column prop="currency" label="币种" width="90" align="center"></el-table-column>
      <el-table-column label="下单日期" width="120" align="center">
        <template slot-scope="scope">{{ formatDateOnly(scope.row.orderDate) }}</template>
      </el-table-column>
      <el-table-column label="确认函数量" width="110" align="center">
        <template slot-scope="scope">
          <el-tag size="small" :type="scope.row.confirmCount ? 'success' : 'info'">
            {{ scope.row.confirmCount || 0 }} 张
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column fixed="right" label="操作" width="190" align="center">
        <template slot-scope="scope">
          <el-button type="text" size="small" @click="viewHandle(scope.row)">详情</el-button>
          <el-button
            v-if="isAuth('erp:tradeorder:update')"
            type="text"
            size="small"
            @click="editHandle(scope.row)">修改</el-button>
          <el-button
            v-if="isAuth('erp:tradeorder:delete')"
            type="text"
            size="small"
            @click="deleteHandle(scope.row.id)">删除</el-button>
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

    <presale-order-dialog
      v-if="dialogVisible"
      ref="dialog"
      :only-estimate="true"
      @refreshDataList="getDataList">
    </presale-order-dialog>

    <presale-upload-dialog
      v-if="uploadVisible"
      ref="uploadDialog"
      upload-type="estimate"
      :order-id="0"
      @recognized="recognizedHandle">
    </presale-upload-dialog>
  </div>
</template>

<script>
import PresaleOrderDialog from './presale-order-dialog'
import PresaleUploadDialog from './presale-upload-dialog'

export default {
  components: {
    PresaleOrderDialog,
    PresaleUploadDialog
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
      dialogVisible: false,
      uploadVisible: false
    }
  },
  activated () {
    this.getDataList()
  },
  methods: {
    getDataList () {
      this.dataListLoading = true
      this.$http({
        url: this.$http.adornUrl('/erp/presale/list'),
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
          this.$message.error((data && data.msg) || '查询失败')
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
    uploadEstimateHandle () {
      this.uploadVisible = true
      this.$nextTick(() => {
        this.$refs.uploadDialog.init()
      })
    },
    recognizedHandle (result) {
      this.dialogVisible = true
      this.$nextTick(() => {
        this.$refs.dialog.initFromEstimateResult(result)
      })
    },
    viewHandle (row) {
      this.dialogVisible = true
      this.$nextTick(() => {
        this.$refs.dialog.init(row.id, true, 'estimate')
      })
    },
    editHandle (row) {
      this.dialogVisible = true
      this.$nextTick(() => {
        this.$refs.dialog.init(row.id, false, 'estimate')
      })
    },
    deleteHandle (id) {
      this.$confirm(`确定删除预售单[id=${id}]吗？`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.$http({
          url: this.$http.adornUrl('/erp/presale/delete'),
          method: 'post',
          data: this.$http.adornData([id], false)
        }).then(({ data }) => {
          if (data && data.code === 0) {
            this.$message.success('删除成功')
            this.getDataList()
          } else {
            this.$message.error((data && data.msg) || '删除失败')
          }
        })
      })
    },
    formatDateOnly (value) {
      return value ? String(value).slice(0, 10) : ''
    }
  }
}
</script>

<style scoped>
.query-form {
  margin-top: 15px;
}

.main-table {
  margin-top: 15px;
}
</style>
