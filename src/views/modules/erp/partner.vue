<template>
  <div class="mod-erp-partner">
    <el-form :inline="true" :model="queryForm">
      <el-form-item>
        <el-input v-model="queryForm.keyword" placeholder="单位编码/名称/联系人" clearable @keyup.enter.native="getDataList()"></el-input>
      </el-form-item>
      <el-form-item>
        <el-select v-model="queryForm.businessRole" clearable placeholder="业务角色">
          <el-option
            v-for="item in bizRoleOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value">
          </el-option>
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="getDataList()">查询</el-button>
        <el-button v-if="isAuth('erp:partner:list')" type="info" :loading="exportLoading" @click="exportHandle()">导出Excel</el-button>
        <el-button v-if="isAuth('erp:partner:update')" type="warning" :loading="syncWecomLoading" @click="syncWecomGroups()">同步企微客户群</el-button>
        <el-button v-if="isAuth('erp:partner:save')" type="success" @click="addOrUpdateHandle()">新增</el-button>
        <el-button v-if="isAuth('erp:partner:delete')" type="danger" :disabled="dataListSelections.length <= 0" @click="deleteHandle()">批量删除</el-button>
      </el-form-item>
    </el-form>

    <el-table :data="dataList" border stripe v-loading="dataListLoading" @selection-change="selectionChangeHandle">
      <el-table-column type="selection" width="50" align="center" header-align="center"></el-table-column>
      <el-table-column prop="partnerCode" label="单位编码" min-width="130" align="center" header-align="center"></el-table-column>
      <el-table-column prop="partnerName" label="单位名称" min-width="220" show-overflow-tooltip></el-table-column>
      <el-table-column label="业务角色" min-width="170" show-overflow-tooltip>
        <template slot-scope="scope">{{ bizRoleLabel(scope.row.businessRole) }}</template>
      </el-table-column>
      <el-table-column label="风险标记" width="100" align="center" header-align="center">
        <template slot-scope="scope">
          <el-tag size="small" :type="riskTagType(scope.row.riskLevel)">{{ riskLabel(scope.row.riskLevel) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="riskRemark" label="风险说明" min-width="180" show-overflow-tooltip></el-table-column>
      <el-table-column prop="riskMarkDate" label="标记日期" width="110" align="center" header-align="center"></el-table-column>
      <el-table-column label="冷库减免天数" width="120" align="center" header-align="center">
        <template slot-scope="scope">{{ scope.row.coldStorageFreeDays || 7 }}天</template>
      </el-table-column>
      <el-table-column label="年利率（%）" width="150" align="right" header-align="center">
        <template slot-scope="scope">{{ scope.row.annualInterestRate === null || scope.row.annualInterestRate === undefined ? '-' : scope.row.annualInterestRate }}</template>
      </el-table-column>
      <el-table-column label="资方账期天数" width="130" align="center" header-align="center">
        <template slot-scope="scope">{{ scope.row.funderCreditDays === null || scope.row.funderCreditDays === undefined ? '-' : scope.row.funderCreditDays + '天' }}</template>
      </el-table-column>
      <el-table-column label="账期预警天数" width="130" align="center" header-align="center">
        <template slot-scope="scope">{{ scope.row.funderWarningDays === null || scope.row.funderWarningDays === undefined ? '-' : scope.row.funderWarningDays + '天' }}</template>
      </el-table-column>
      <el-table-column prop="wecomChatName" label="企微客户群" min-width="180" show-overflow-tooltip></el-table-column>
      <el-table-column prop="wecomChatOwner" label="企微群主" width="110" align="center" header-align="center"></el-table-column>
      <el-table-column prop="taxNo" label="税号" min-width="170" show-overflow-tooltip></el-table-column>
      <el-table-column prop="contactName" label="联系人" width="100" align="center" header-align="center"></el-table-column>
      <el-table-column prop="contactPhone" label="联系电话" width="130" align="center" header-align="center"></el-table-column>
      <el-table-column prop="bankName" label="开户行" min-width="160" show-overflow-tooltip></el-table-column>
      <el-table-column label="状态" width="80" align="center" header-align="center">
        <template slot-scope="scope">
          <el-tag size="small" :type="scope.row.status === 1 ? 'success' : 'info'">{{ scope.row.status === 1 ? '启用' : '停用' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column fixed="right" label="操作" width="150" align="center" header-align="center">
        <template slot-scope="scope">
          <el-button v-if="isAuth('erp:partner:update')" type="text" size="small" @click="addOrUpdateHandle(scope.row.id)">修改</el-button>
          <el-button v-if="isAuth('erp:partner:delete')" type="text" size="small" @click="deleteHandle(scope.row.id)">删除</el-button>
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
import AddOrUpdate from './partner-add-or-update'
import { PARTNER_BIZ_ROLE_OPTIONS, getMultiOptionLabel } from './const'

export default {
  data () {
    return {
      queryForm: {
        keyword: '',
        businessRole: ''
      },
      dataList: [],
      pageIndex: 1,
      pageSize: 10,
      totalPage: 0,
      dataListLoading: false,
      dataListSelections: [],
      addOrUpdateVisible: false,
      syncWecomLoading: false,
      exportLoading: false,
      bizRoleOptions: PARTNER_BIZ_ROLE_OPTIONS
    }
  },
  components: {
    AddOrUpdate
  },
  activated () {
    this.getDataList()
  },
  methods: {
    bizRoleLabel (value) {
      return getMultiOptionLabel(this.bizRoleOptions, value)
    },
    riskLabel (value) {
      const map = { NORMAL: '正常', WATCH: '关注', DEFAULTED: '违约', BLACKLIST: '黑名单' }
      return map[value] || '正常'
    },
    riskTagType (value) {
      const map = { NORMAL: 'success', WATCH: 'warning', DEFAULTED: 'danger', BLACKLIST: 'info' }
      return map[value] || 'success'
    },
    getDataList () {
      this.dataListLoading = true
      this.$http({
        url: this.$http.adornUrl('/erp/partner/list'),
        method: 'get',
        params: this.$http.adornParams({
          page: this.pageIndex,
          limit: this.pageSize,
          keyword: this.queryForm.keyword,
          businessRole: this.queryForm.businessRole
        })
      }).then(({ data }) => {
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
    exportHandle () {
      this.exportLoading = true
      this.$http({
        url: this.$http.adornUrl('/erp/partner/export'),
        method: 'get',
        params: this.$http.adornParams({
          keyword: this.queryForm.keyword,
          businessRole: this.queryForm.businessRole
        }),
        responseType: 'blob'
      }).then(({ data }) => {
        this.downloadBlob(data, '往来单位.xlsx')
      }).catch(() => {
        this.$message.error('导出失败')
      }).finally(() => {
        this.exportLoading = false
      })
    },
    downloadBlob (blob, fileName) {
      const url = window.URL.createObjectURL(new Blob([blob], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      }))
      const link = document.createElement('a')
      link.href = url
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    },
    addOrUpdateHandle (id) {
      this.addOrUpdateVisible = true
      this.$nextTick(() => {
        this.$refs.addOrUpdate.init(id)
      })
    },
    syncWecomGroups () {
      this.syncWecomLoading = true
      this.$http({
        url: this.$http.adornUrl('/erp/wecom/groups/sync'),
        method: 'post',
        data: this.$http.adornData({})
      }).then(({ data }) => {
        if (data && data.code === 0) {
          this.$message.success(`已同步${(data.list || []).length}个企微客户群`)
        } else {
          this.$message.error((data && data.msg) || '同步企微客户群失败')
        }
        this.syncWecomLoading = false
      }).catch(() => {
        this.syncWecomLoading = false
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
          url: this.$http.adornUrl('/erp/partner/delete'),
          method: 'post',
          data: this.$http.adornData(ids, false)
        }).then(({ data }) => {
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
.mod-erp-partner .el-pagination {
  margin-top: 15px;
  text-align: right;
}
</style>
