<template>
  <div class="mod-erp-product-price">
    <el-form :inline="true" :model="queryForm">
      <el-form-item>
        <el-select v-model="queryForm.productId" filterable clearable placeholder="产品">
          <el-option
            v-for="item in productList"
            :key="item.id"
            :label="item.productName + ' / ' + item.productCode"
            :value="item.id">
          </el-option>
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-select v-model="queryForm.priceType" clearable placeholder="价格类型">
          <el-option
            v-for="item in priceTypeOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value">
          </el-option>
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="getDataList()">查询</el-button>
        <el-button v-if="isAuth('erp:productprice:save')" type="success" @click="addOrUpdateHandle()">新增</el-button>
        <el-button v-if="isAuth('erp:productprice:delete')" type="danger" :disabled="dataListSelections.length <= 0" @click="deleteHandle()">批量删除</el-button>
      </el-form-item>
    </el-form>

    <el-table :data="dataList" border stripe v-loading="dataListLoading" @selection-change="selectionChangeHandle">
      <el-table-column type="selection" width="50" align="center" header-align="center"></el-table-column>
      <el-table-column label="产品" min-width="220" show-overflow-tooltip>
        <template slot-scope="scope">{{ productLabel(scope.row.productId) }}</template>
      </el-table-column>
      <el-table-column label="单位" min-width="180" show-overflow-tooltip>
        <template slot-scope="scope">{{ partnerLabel(scope.row.partnerId) || '通用价格' }}</template>
      </el-table-column>
      <el-table-column label="价格类型" width="100" align="center" header-align="center">
        <template slot-scope="scope">{{ priceTypeLabel(scope.row.priceType) }}</template>
      </el-table-column>
      <el-table-column prop="effectiveDate" label="生效日期" min-width="160" align="center" header-align="center"></el-table-column>
      <el-table-column prop="currency" label="币种" width="80" align="center" header-align="center"></el-table-column>
      <el-table-column prop="unitPrice" label="未税单价" width="110" align="center" header-align="center"></el-table-column>
      <el-table-column prop="taxRate" label="税率(%)" width="90" align="center" header-align="center"></el-table-column>
      <el-table-column prop="remark" label="备注" min-width="220" show-overflow-tooltip></el-table-column>
      <el-table-column fixed="right" label="操作" width="150" align="center" header-align="center">
        <template slot-scope="scope">
          <el-button v-if="isAuth('erp:productprice:update')" type="text" size="small" @click="addOrUpdateHandle(scope.row.id)">修改</el-button>
          <el-button v-if="isAuth('erp:productprice:delete')" type="text" size="small" @click="deleteHandle(scope.row.id)">删除</el-button>
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
  </div>
</template>

<script>
  import AddOrUpdate from './product-price-add-or-update'
  import { PRICE_TYPE_OPTIONS, getOptionLabel } from './const'

  export default {
    data () {
      return {
        queryForm: {
          productId: '',
          priceType: ''
        },
        dataList: [],
        productList: [],
        partnerList: [],
        pageIndex: 1,
        pageSize: 10,
        totalPage: 0,
        dataListLoading: false,
        dataListSelections: [],
        addOrUpdateVisible: false,
        priceTypeOptions: PRICE_TYPE_OPTIONS
      }
    },
    components: {
      AddOrUpdate
    },
    activated () {
      this.loadSelectList(() => {
        this.getDataList()
      })
    },
    methods: {
      loadSelectList (callback) {
        Promise.all([
          this.$http({
            url: this.$http.adornUrl('/erp/product/select'),
            method: 'get',
            params: this.$http.adornParams()
          }),
          this.$http({
            url: this.$http.adornUrl('/erp/partner/select'),
            method: 'get',
            params: this.$http.adornParams()
          })
        ]).then(([productRes, partnerRes]) => {
          this.productList = ((productRes.data || {}).list) || []
          this.partnerList = ((partnerRes.data || {}).list) || []
          if (callback) {
            callback()
          }
        })
      },
      productLabel (id) {
        const item = this.productList.find(product => product.id === id)
        return item ? `${item.productName} / ${item.productCode}` : id
      },
      partnerLabel (id) {
        const item = this.partnerList.find(partner => partner.id === id)
        return item ? item.partnerName : ''
      },
      priceTypeLabel (value) {
        return getOptionLabel(this.priceTypeOptions, value)
      },
      getDataList () {
        this.dataListLoading = true
        this.$http({
          url: this.$http.adornUrl('/erp/productprice/list'),
          method: 'get',
          params: this.$http.adornParams({
            page: this.pageIndex,
            limit: this.pageSize,
            productId: this.queryForm.productId,
            priceType: this.queryForm.priceType
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
          this.$refs.addOrUpdate.init(id, this.productList, this.partnerList)
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
            url: this.$http.adornUrl('/erp/productprice/delete'),
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
  .mod-erp-product-price .el-pagination {
    margin-top: 15px;
    text-align: right;
  }
</style>
