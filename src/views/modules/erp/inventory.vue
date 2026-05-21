<template>
  <div class="mod-erp-inventory">
    <el-form :inline="true" :model="queryForm">
      <el-form-item>
        <el-input v-model="queryForm.productName" placeholder="产品名称" clearable @keyup.enter.native="getDataList()"></el-input>
      </el-form-item>
      <el-form-item>
        <el-input v-model="queryForm.warehouseName" placeholder="仓库名称" clearable @keyup.enter.native="getDataList()"></el-input>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="getDataList()">查询</el-button>
      </el-form-item>
    </el-form>

    <el-table :data="dataList" border stripe v-loading="dataListLoading">
      <el-table-column prop="productCode" label="产品编码" min-width="120" align="center" header-align="center"></el-table-column>
      <el-table-column prop="productName" label="产品名称" min-width="180" show-overflow-tooltip></el-table-column>
      <el-table-column prop="productSpec" label="规格" min-width="140" show-overflow-tooltip></el-table-column>
      <el-table-column prop="batchNo" label="批次" min-width="120" show-overflow-tooltip></el-table-column>
      <el-table-column prop="warehouseName" label="仓库" min-width="160" show-overflow-tooltip></el-table-column>
      <el-table-column prop="totalInPieces" label="累计入库件数" width="120" align="right" header-align="center"></el-table-column>
      <el-table-column prop="totalOutPieces" label="累计出库件数" width="120" align="right" header-align="center"></el-table-column>
      <el-table-column prop="stockPieces" label="当前库存件数" width="120" align="right" header-align="center"></el-table-column>
      <el-table-column prop="totalInQuantity" label="累计入库" width="110" align="right" header-align="center"></el-table-column>
      <el-table-column prop="totalOutQuantity" label="累计出库" width="110" align="right" header-align="center"></el-table-column>
      <el-table-column prop="stockQuantity" label="当前库存" width="110" align="right" header-align="center"></el-table-column>
      <el-table-column prop="safeStockBoxes" label="安全库存件数" width="120" align="right" header-align="center"></el-table-column>
      <el-table-column prop="nearestExpiryDate" label="最近到期日" min-width="160" align="center" header-align="center"></el-table-column>
      <el-table-column label="预警" width="140" align="center" header-align="center">
        <template slot-scope="scope">
          <el-tag v-if="scope.row.safetyWarning" size="small" type="danger" style="margin-right: 4px;">安全库存</el-tag>
          <el-tag v-if="scope.row.freshnessWarning" size="small" type="warning">保鲜</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="lastUnitPrice" label="最近单价" width="110" align="right" header-align="center"></el-table-column>
    </el-table>
  </div>
</template>

<script>
  export default {
    data () {
      return {
        queryForm: {
          productName: '',
          warehouseName: ''
        },
        dataList: [],
        dataListLoading: false
      }
    },
    activated () {
      this.getDataList()
    },
    methods: {
      getDataList () {
        this.dataListLoading = true
        this.$http({
          url: this.$http.adornUrl('/erp/inventory/summary'),
          method: 'get',
          params: this.$http.adornParams(this.queryForm)
        }).then(({data}) => {
          if (data && data.code === 0) {
            this.dataList = data.list || []
          } else {
            this.dataList = []
            this.$message.error(data.msg || '获取库存失败')
          }
          this.dataListLoading = false
        }).catch(() => {
          this.dataListLoading = false
        })
      }
    }
  }
</script>
