<template>
  <div class="mod-operation-audit">
    <el-form :inline="true" :model="dataForm" class="audit-search" @keyup.enter.native="searchHandle">
      <el-form-item label="操作账号">
        <el-input v-model.trim="dataForm.username" clearable placeholder="输入登录账号"></el-input>
      </el-form-item>
      <el-form-item label="业务模块">
        <el-select v-model="dataForm.moduleName" clearable filterable placeholder="选择业务模块">
          <el-option v-for="item in moduleOptions" :key="item" :label="item" :value="item"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="操作类型">
        <el-select v-model="dataForm.operationType" clearable placeholder="选择操作类型">
          <el-option v-for="item in operationOptions" :key="item.value" :label="item.label" :value="item.value"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="业务单号">
        <el-input v-model.trim="dataForm.businessNo" clearable placeholder="合同号、销售单号等"></el-input>
      </el-form-item>
      <el-form-item label="执行结果">
        <el-select v-model="dataForm.success" clearable placeholder="全部">
          <el-option label="成功" value="1"></el-option>
          <el-option label="失败" value="0"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="操作时间">
        <el-date-picker
          v-model="dataForm.dateRange"
          type="daterange"
          value-format="yyyy-MM-dd"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          clearable>
        </el-date-picker>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="searchHandle">查询</el-button>
        <el-button @click="resetHandle">重置</el-button>
      </el-form-item>
    </el-form>

    <el-table :data="dataList" border stripe v-loading="dataListLoading" height="calc(100vh - 285px)" style="width: 100%">
      <el-table-column type="index" label="序号" width="60" align="center" fixed="left"></el-table-column>
      <el-table-column prop="createTime" label="操作时间" width="165" align="center"></el-table-column>
      <el-table-column prop="username" label="操作账号" width="120" show-overflow-tooltip></el-table-column>
      <el-table-column prop="roleNames" label="角色" width="130" show-overflow-tooltip></el-table-column>
      <el-table-column prop="moduleName" label="业务模块" width="170" show-overflow-tooltip></el-table-column>
      <el-table-column prop="operationName" label="操作" width="105" align="center"></el-table-column>
      <el-table-column prop="businessNo" label="业务单号" min-width="170" show-overflow-tooltip></el-table-column>
      <el-table-column prop="requestUri" label="接口地址" min-width="230" show-overflow-tooltip></el-table-column>
      <el-table-column label="结果" width="82" align="center">
        <template slot-scope="scope">
          <el-tag :type="Number(scope.row.success) === 1 ? 'success' : 'danger'" size="small">
            {{ Number(scope.row.success) === 1 ? '成功' : '失败' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="ip" label="IP地址" width="140" show-overflow-tooltip></el-table-column>
      <el-table-column prop="durationMs" label="耗时(ms)" width="95" align="right"></el-table-column>
      <el-table-column label="操作" width="82" align="center" fixed="right">
        <template slot-scope="scope">
          <el-button type="text" @click="detailHandle(scope.row.id)">详情</el-button>
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

    <el-dialog title="操作审计详情" :visible.sync="detailVisible" width="76%" top="5vh" append-to-body>
      <div v-loading="detailLoading" class="audit-detail">
        <el-row :gutter="18" class="detail-summary">
          <el-col :span="8"><span class="detail-label">操作账号</span>{{ detail.username || '-' }}</el-col>
          <el-col :span="8"><span class="detail-label">角色</span>{{ detail.roleNames || '-' }}</el-col>
          <el-col :span="8"><span class="detail-label">操作时间</span>{{ detail.createTime || '-' }}</el-col>
          <el-col :span="8"><span class="detail-label">业务模块</span>{{ detail.moduleName || '-' }}</el-col>
          <el-col :span="8"><span class="detail-label">操作类型</span>{{ detail.operationName || '-' }}</el-col>
          <el-col :span="8"><span class="detail-label">执行结果</span>{{ Number(detail.success) === 1 ? '成功' : '失败' }}</el-col>
          <el-col :span="8"><span class="detail-label">业务单号</span>{{ detail.businessNo || '-' }}</el-col>
          <el-col :span="8"><span class="detail-label">IP地址</span>{{ detail.ip || '-' }}</el-col>
          <el-col :span="8"><span class="detail-label">执行耗时</span>{{ detail.durationMs == null ? '-' : detail.durationMs + ' ms' }}</el-col>
          <el-col :span="24"><span class="detail-label">接口地址</span>{{ detail.requestMethod }} {{ detail.requestUri }}</el-col>
          <el-col v-if="detail.errorMessage" :span="24" class="detail-error">
            <span class="detail-label">失败原因</span>{{ detail.errorMessage }}
          </el-col>
        </el-row>

        <div class="detail-block">
          <div class="detail-title">操作输入（敏感信息已脱敏）</div>
          <pre>{{ prettyJson(detail.requestData) }}</pre>
        </div>
        <div class="detail-block">
          <div class="detail-title">操作结果（敏感信息已脱敏）</div>
          <pre>{{ prettyJson(detail.responseData) }}</pre>
        </div>
        <div class="detail-block detail-device">
          <div class="detail-title">浏览器及设备</div>
          <div>{{ detail.userAgent || '-' }}</div>
        </div>
      </div>
      <span slot="footer" class="dialog-footer">
        <el-button @click="detailVisible = false">关闭</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
export default {
  data () {
    return {
      dataForm: {
        username: '',
        moduleName: '',
        operationType: '',
        businessNo: '',
        success: '',
        dateRange: []
      },
      moduleOptions: [
        '登录认证', '往来单位', '产品档案', '价格历史', '仓库管理', '司机信息维护',
        '销售信息维护', '内部主体管理', '预售单及客户订单确认', '入库管理', '采购单',
        '销售单及出库批次', '库存汇总', '库存调整', '库存成本查询', '预售打款及资方贷款',
        '支出费用', '费用支出登记', '合同成本日报', '现货融资', '财务汇总', 'OCR识别',
        '企业微信通知', '企业微信回调'
      ],
      operationOptions: [
        { value: 'LOGIN', label: '登录' },
        { value: 'LOGOUT', label: '退出登录' },
        { value: 'CREATE', label: '新增/保存' },
        { value: 'UPDATE', label: '修改' },
        { value: 'DELETE', label: '删除' },
        { value: 'CONFIRM', label: '确认' },
        { value: 'REVIEW', label: '审核' },
        { value: 'REJECT', label: '驳回' },
        { value: 'VOID', label: '作废' },
        { value: 'UPLOAD', label: '上传' },
        { value: 'DOWNLOAD', label: '下载' },
        { value: 'PREVIEW', label: '预览' },
        { value: 'EXPORT', label: '导出' },
        { value: 'OCR', label: 'OCR识别' },
        { value: 'SEND', label: '发送通知' },
        { value: 'BIND', label: '绑定' }
      ],
      dataList: [],
      pageIndex: 1,
      pageSize: 20,
      totalPage: 0,
      dataListLoading: false,
      detailVisible: false,
      detailLoading: false,
      detail: {}
    }
  },
  created () {
    this.getDataList()
  },
  methods: {
    getDataList () {
      this.dataListLoading = true
      const dateRange = this.dataForm.dateRange || []
      this.$http({
        url: this.$http.adornUrl('/sys/operationaudit/list'),
        method: 'get',
        params: this.$http.adornParams({
          page: this.pageIndex,
          limit: this.pageSize,
          username: this.dataForm.username,
          moduleName: this.dataForm.moduleName,
          operationType: this.dataForm.operationType,
          businessNo: this.dataForm.businessNo,
          success: this.dataForm.success,
          startDate: dateRange[0] || '',
          endDate: dateRange[1] || ''
        })
      }).then(({ data }) => {
        if (data && data.code === 0) {
          this.dataList = data.page.list || []
          this.totalPage = data.page.totalCount || 0
        } else {
          this.dataList = []
          this.totalPage = 0
          this.$message.error((data && data.msg) || '操作审计加载失败')
        }
      }).catch(() => {
        this.dataList = []
        this.totalPage = 0
        this.$message.error('操作审计加载失败，请检查后端服务')
      }).finally(() => {
        this.dataListLoading = false
      })
    },
    searchHandle () {
      this.pageIndex = 1
      this.getDataList()
    },
    resetHandle () {
      this.dataForm = {
        username: '',
        moduleName: '',
        operationType: '',
        businessNo: '',
        success: '',
        dateRange: []
      }
      this.searchHandle()
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
    detailHandle (id) {
      this.detailVisible = true
      this.detailLoading = true
      this.detail = {}
      this.$http({
        url: this.$http.adornUrl(`/sys/operationaudit/info/${id}`),
        method: 'get',
        params: this.$http.adornParams()
      }).then(({ data }) => {
        if (data && data.code === 0) {
          this.detail = data.audit || {}
        } else {
          this.$message.error((data && data.msg) || '审计详情加载失败')
        }
      }).catch(() => {
        this.$message.error('审计详情加载失败，请检查后端服务')
      }).finally(() => {
        this.detailLoading = false
      })
    },
    prettyJson (value) {
      if (!value) return '-'
      try {
        return JSON.stringify(JSON.parse(value), null, 2)
      } catch (e) {
        return value
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.mod-operation-audit {
  .audit-search {
    padding: 14px 16px 2px;
    margin-bottom: 14px;
    background: linear-gradient(120deg, #f4f9ff 0%, #f8fbfc 100%);
    border: 1px solid #dfe9f2;
    border-radius: 8px;
  }

  .el-pagination {
    margin-top: 14px;
    text-align: right;
  }
}

.audit-detail {
  min-height: 240px;

  .detail-summary {
    padding: 14px 16px 4px;
    line-height: 34px;
    color: #34495e;
    background: #f6f9fc;
    border: 1px solid #e3ebf2;
    border-radius: 8px;
  }

  .detail-label {
    display: inline-block;
    min-width: 82px;
    margin-right: 8px;
    color: #7b8a9a;
  }

  .detail-error {
    color: #d94b4b;
  }

  .detail-block {
    margin-top: 16px;
    border: 1px solid #e3ebf2;
    border-radius: 8px;
    overflow: hidden;
  }

  .detail-title {
    padding: 10px 14px;
    color: #24445f;
    font-weight: 600;
    background: #edf5fa;
  }

  pre {
    max-height: 240px;
    padding: 14px;
    margin: 0;
    overflow: auto;
    color: #334155;
    line-height: 1.6;
    white-space: pre-wrap;
    word-break: break-all;
    background: #fbfdff;
  }

  .detail-device > div:last-child {
    padding: 12px 14px;
    word-break: break-all;
  }
}
</style>
