<template>
  <el-dialog
    title="批量新增产品"
    :close-on-click-modal="false"
    :visible.sync="visible"
    width="980px">
    <div class="batch-dialog-tip">
      识别到以下产品尚未建立主数据，请先确认新增后再继续录入预售销售单。
    </div>

    <el-table :data="dataList" border size="mini" max-height="420">
      <el-table-column label="#" width="50" align="center">
        <template slot-scope="scope">{{ scope.$index + 1 }}</template>
      </el-table-column>
      <el-table-column label="产品编码" min-width="140">
        <template slot-scope="scope">
          <el-input v-model.trim="scope.row.productCode"></el-input>
        </template>
      </el-table-column>
      <el-table-column label="产品中文名称" min-width="180">
        <template slot-scope="scope">
          <el-input v-model.trim="scope.row.productName"></el-input>
        </template>
      </el-table-column>
      <el-table-column label="产品英文名称" min-width="220">
        <template slot-scope="scope">
          <el-input v-model.trim="scope.row.productNameEn"></el-input>
        </template>
      </el-table-column>
      <el-table-column label="品牌方" min-width="180">
        <template slot-scope="scope">
          <el-select v-model="scope.row.brand" clearable filterable style="width: 100%;">
            <el-option
              v-for="item in brandOptions"
              :key="item.id"
              :label="item.partnerName"
              :value="item.partnerName">
            </el-option>
          </el-select>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="90" align="center">
        <template slot-scope="scope">
          <el-tag size="small" type="success">{{ scope.row.status === 1 ? '启用' : '停用' }}</el-tag>
        </template>
      </el-table-column>
    </el-table>

    <span slot="footer" class="dialog-footer">
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" :loading="saveLoading" :disabled="saveLoading" @click="submitHandle()">确认新增</el-button>
    </span>
  </el-dialog>
</template>

<script>
export default {
  props: {
    brandOptions: {
      type: Array,
      default: () => []
    }
  },
  data () {
    return {
      visible: false,
      saveLoading: false,
      dataList: []
    }
  },
  methods: {
    resolveDefaultBrand (brandName) {
      const sourceName = String(brandName || '').trim()
      if (!sourceName) {
        return ''
      }
      if (/silver\s*fern\s*farms/i.test(sourceName)) {
        return '银之蕨食品（上海）有限公司'
      }
      return sourceName
    },
    init (rows) {
      this.visible = true
      this.saveLoading = false
      this.dataList = (rows || []).map(item => Object.assign({
        productCode: '',
        productName: '',
        productNameEn: '',
        brand: this.resolveDefaultBrand((item || {}).brand),
        status: 1
      }, item || {}))
    },
    submitHandle () {
      if (this.saveLoading) {
        return
      }
      const invalidRow = this.dataList.find(item => !item.productCode)
      if (invalidRow) {
        this.$message.error('产品编码不能为空')
        return
      }
      const invalidBrandRow = this.dataList.find(item => !item.brand)
      if (invalidBrandRow) {
        this.$message.error('品牌方不能为空')
        return
      }
      const tasks = this.dataList.map(item => {
        const payload = {
          productCode: item.productCode,
          productName: item.productName,
          productNameEn: item.productNameEn,
          brand: item.brand,
          unit: 'KG',
          status: 1
        }
        return this.$http({
          url: this.$http.adornUrl('/erp/product/save'),
          method: 'post',
          data: this.$http.adornData(payload)
        })
      })
      this.saveLoading = true
      Promise.all(tasks).then((results) => {
        const failed = results.find(item => !item.data || item.data.code !== 0)
        if (failed) {
          this.$message.error(((failed.data || {}).msg) || '批量新增产品失败')
          return
        }
        this.$message.success('产品新增成功')
        this.visible = false
        this.$emit('saved')
      }).catch(() => {
        this.$message.error('批量新增产品失败')
      }).finally(() => {
        this.saveLoading = false
      })
    }
  }
}
</script>

<style scoped>
.batch-dialog-tip {
  margin-bottom: 12px;
  color: #606266;
}
</style>
