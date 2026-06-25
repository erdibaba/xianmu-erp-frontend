<template>
  <div class="mod-erp-manual-expense">
    <el-alert
      title="用于登记系统自动费用之外的其他支出，附件仅做归档保存，不做OCR识别。"
      type="info"
      :closable="false"
      show-icon>
    </el-alert>

    <el-form :inline="true" :model="queryForm" class="query-form">
      <el-form-item>
        <el-input
          v-model="queryForm.keyword"
          placeholder="费用编号/费用名称/备注"
          clearable
          @keyup.enter.native="searchHandle">
        </el-input>
      </el-form-item>
      <el-form-item>
        <el-select v-model="queryForm.expenseType" clearable filterable allow-create default-first-option placeholder="费用类型" style="width: 170px;">
          <el-option
            v-for="item in expenseTypeOptions"
            :key="item"
            :label="item"
            :value="item">
          </el-option>
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-date-picker
          v-model="queryDateRange"
          type="daterange"
          value-format="yyyy-MM-dd"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          range-separator="至">
        </el-date-picker>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="searchHandle">查询</el-button>
        <el-button @click="resetQuery">重置</el-button>
        <el-button v-if="isAuth('erp:manual-expense:save')" type="success" @click="openDialog()">新增费用</el-button>
        <el-button
          v-if="isAuth('erp:manual-expense:delete')"
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
      <el-table-column prop="expenseNo" label="费用编号" min-width="170" show-overflow-tooltip></el-table-column>
      <el-table-column prop="expenseDate" label="费用日期" width="120" align="center" header-align="center">
        <template slot-scope="scope">{{ dateText(scope.row.expenseDate) }}</template>
      </el-table-column>
      <el-table-column prop="expenseType" label="费用类型" width="130" show-overflow-tooltip></el-table-column>
      <el-table-column prop="expenseName" label="费用名称" min-width="180" show-overflow-tooltip></el-table-column>
      <el-table-column label="支出金额" width="130" align="right" header-align="center">
        <template slot-scope="scope">{{ moneyText(scope.row.amount) }}</template>
      </el-table-column>
      <el-table-column label="附件" width="90" align="center" header-align="center">
        <template slot-scope="scope">{{ (scope.row.fileList || []).length }}</template>
      </el-table-column>
      <el-table-column prop="remark" label="备注" min-width="220" show-overflow-tooltip></el-table-column>
      <el-table-column prop="createTime" label="创建时间" width="160" align="center" header-align="center"></el-table-column>
      <el-table-column fixed="right" label="操作" width="130" align="center" header-align="center">
        <template slot-scope="scope">
          <el-button v-if="isAuth('erp:manual-expense:info')" type="text" size="small" @click="openDialog(scope.row.id)">详情</el-button>
          <el-button v-if="isAuth('erp:manual-expense:delete')" type="text" size="small" @click="deleteHandle(scope.row.id)">删除</el-button>
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

    <el-dialog
      :title="dataForm.id ? '费用支出详情' : '新增费用支出'"
      :close-on-click-modal="false"
      :visible.sync="dialogVisible"
      width="760px">
      <el-form :model="dataForm" :rules="dataRule" ref="dataForm" label-width="100px">
        <el-row :gutter="14">
          <el-col :span="12">
            <el-form-item label="费用日期" prop="expenseDate">
              <el-date-picker
                v-model="dataForm.expenseDate"
                type="date"
                value-format="yyyy-MM-dd"
                placeholder="选择费用日期"
                :disabled="!!dataForm.id"
                style="width: 100%;">
              </el-date-picker>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="费用类型">
              <el-select v-model="dataForm.expenseType" filterable allow-create default-first-option clearable placeholder="选择或输入费用类型" :disabled="!!dataForm.id" style="width: 100%;">
                <el-option
                  v-for="item in expenseTypeOptions"
                  :key="item"
                  :label="item"
                  :value="item">
                </el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="费用名称" prop="expenseName">
              <el-input v-model.trim="dataForm.expenseName" maxlength="128" show-word-limit :disabled="!!dataForm.id"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="支出金额" prop="amount">
              <el-input-number v-model="dataForm.amount" :precision="2" :min="0" :controls="false" :disabled="!!dataForm.id" style="width: 100%;"></el-input-number>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="备注">
              <el-input v-model.trim="dataForm.remark" type="textarea" :rows="3" maxlength="1000" show-word-limit :disabled="!!dataForm.id"></el-input>
            </el-form-item>
          </el-col>
          <el-col v-if="!dataForm.id" :span="24">
            <el-form-item label="支出附件">
              <el-upload
                action="#"
                multiple
                :auto-upload="false"
                :file-list="uploadFileList"
                :on-change="uploadChange"
                :on-remove="uploadRemove">
                <el-button size="small" type="primary">选择附件</el-button>
                <div slot="tip" class="el-upload__tip">支持图片、PDF、Excel、Word等常见凭证文件，保存后自动归档。</div>
              </el-upload>
            </el-form-item>
          </el-col>
          <el-col v-if="dataForm.id" :span="24">
            <el-form-item label="已归档附件">
              <el-table :data="dataForm.fileList || []" border size="mini" max-height="180">
                <el-table-column type="index" label="序号" width="55" align="center"></el-table-column>
                <el-table-column prop="fileName" label="文件名" min-width="260" show-overflow-tooltip></el-table-column>
                <el-table-column prop="createTime" label="上传时间" width="160" align="center"></el-table-column>
                <el-table-column label="操作" width="120" align="center">
                  <template slot-scope="scope">
                    <el-button type="text" size="mini" @click="downloadFile(scope.row)">下载</el-button>
                  </template>
                </el-table-column>
              </el-table>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button :disabled="submitLoading" @click="dialogVisible = false">{{ dataForm.id ? '关闭' : '取消' }}</el-button>
        <el-button v-if="!dataForm.id" type="primary" :loading="submitLoading" @click="submitHandle">保存</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
  const defaultForm = () => ({
    id: 0,
    expenseNo: '',
    expenseDate: '',
    expenseType: '',
    expenseName: '',
    amount: 0,
    remark: '',
    fileList: []
  })

  export default {
    data () {
      return {
        queryForm: {
          keyword: '',
          expenseType: ''
        },
        queryDateRange: [],
        dataList: [],
        pageIndex: 1,
        pageSize: 10,
        totalPage: 0,
        dataListLoading: false,
        dataListSelections: [],
        deleteLoading: false,
        expenseTypeOptions: [],
        dialogVisible: false,
        submitLoading: false,
        dataForm: defaultForm(),
        uploadFileList: [],
        dataRule: {
          expenseDate: [
            { required: true, message: '费用日期不能为空', trigger: 'change' }
          ],
          expenseName: [
            { required: true, message: '费用名称不能为空', trigger: 'blur' }
          ],
          amount: [
            { required: true, message: '支出金额不能为空', trigger: 'blur' }
          ]
        }
      }
    },
    activated () {
      this.loadExpenseTypes()
      this.getDataList()
    },
    methods: {
      loadExpenseTypes () {
        this.$http({
          url: this.$http.adornUrl('/erp/manual-expense/types'),
          method: 'get',
          params: this.$http.adornParams()
        }).then(({data}) => {
          if (data && data.code === 0) {
            this.expenseTypeOptions = data.list || []
          }
        })
      },
      searchHandle () {
        this.pageIndex = 1
        this.getDataList()
      },
      getDataList () {
        this.dataListLoading = true
        const range = this.queryDateRange || []
        this.$http({
          url: this.$http.adornUrl('/erp/manual-expense/list'),
          method: 'get',
          params: this.$http.adornParams({
            page: this.pageIndex,
            limit: this.pageSize,
            keyword: this.queryForm.keyword,
            expenseType: this.queryForm.expenseType,
            dateStart: range[0] || '',
            dateEnd: range[1] || ''
          })
        }).then(({data}) => {
          if (data && data.code === 0) {
            this.dataList = data.page.list || []
            this.totalPage = data.page.totalCount || 0
          } else {
            this.dataList = []
            this.totalPage = 0
            this.$message.error((data && data.msg) || '获取费用支出失败')
          }
        }).finally(() => {
          this.dataListLoading = false
        })
      },
      resetQuery () {
        this.queryForm.keyword = ''
        this.queryForm.expenseType = ''
        this.queryDateRange = []
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
      selectionChangeHandle (val) {
        this.dataListSelections = val
      },
      openDialog (id) {
        this.dialogVisible = true
        this.submitLoading = false
        this.uploadFileList = []
        this.dataForm = defaultForm()
        this.dataForm.id = id || 0
        this.$nextTick(() => {
          this.$refs.dataForm && this.$refs.dataForm.resetFields()
          if (this.dataForm.id) {
            this.loadDetail(this.dataForm.id)
          }
        })
      },
      loadDetail (id) {
        this.submitLoading = true
        this.$http({
          url: this.$http.adornUrl(`/erp/manual-expense/info/${id}`),
          method: 'get',
          params: this.$http.adornParams()
        }).then(({data}) => {
          if (data && data.code === 0) {
            this.dataForm = Object.assign(defaultForm(), data.expense || {})
          } else {
            this.$message.error((data && data.msg) || '获取费用支出失败')
          }
        }).finally(() => {
          this.submitLoading = false
        })
      },
      uploadChange (file, fileList) {
        this.uploadFileList = fileList
      },
      uploadRemove (file, fileList) {
        this.uploadFileList = fileList
      },
      submitHandle () {
        if (this.dataForm.id) {
          return
        }
        this.$refs.dataForm.validate((valid) => {
          if (!valid || this.submitLoading) {
            return
          }
          this.submitLoading = true
          this.$http({
            url: this.$http.adornUrl('/erp/manual-expense/save'),
            method: 'post',
            data: this.$http.adornData(this.dataForm)
          }).then(({data}) => {
            if (data && data.code === 0) {
              const expense = data.expense || this.dataForm
              const expenseId = expense.id || this.dataForm.id
              return this.uploadPendingFiles(expenseId).then(() => {
                this.$message.success('保存成功')
                this.dialogVisible = false
                this.loadExpenseTypes()
                this.getDataList()
              })
            }
            this.$message.error((data && data.msg) || '保存失败')
          }).finally(() => {
            this.submitLoading = false
          })
        })
      },
      uploadPendingFiles (expenseId) {
        const rawFiles = (this.uploadFileList || []).map(item => item.raw).filter(Boolean)
        if (!rawFiles.length) {
          return Promise.resolve()
        }
        const formData = new FormData()
        formData.append('expenseId', expenseId)
        rawFiles.forEach(file => formData.append('files', file))
        return this.$http({
          url: this.$http.adornUrl('/erp/manual-expense/upload'),
          method: 'post',
          data: formData,
          headers: { 'Content-Type': 'multipart/form-data' }
        }).then(({data}) => {
          if (!data || data.code !== 0) {
            return Promise.reject(new Error((data && data.msg) || '附件上传失败'))
          }
        }).catch((error) => {
          this.$message.error(error.message || '附件上传失败')
          return Promise.reject(error)
        })
      },
      deleteHandle (id) {
        const ids = id ? [id] : this.dataListSelections.map(item => item.id)
        this.$confirm('确定删除选中的费用支出记录吗？附件也会一起删除。', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }).then(() => {
          this.deleteLoading = true
          return this.$http({
            url: this.$http.adornUrl('/erp/manual-expense/delete'),
            method: 'post',
            data: this.$http.adornData(ids, false)
          })
        }).then(({data}) => {
          if (data && data.code === 0) {
            this.$message.success('删除成功')
            this.getDataList()
          } else {
            this.$message.error((data && data.msg) || '删除失败')
          }
        }).catch(() => {
        }).finally(() => {
          this.deleteLoading = false
        })
      },
      deleteFile (file) {
        this.$confirm('确定删除这个附件吗？', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }).then(() => {
          this.submitLoading = true
          return this.$http({
            url: this.$http.adornUrl(`/erp/manual-expense/delete/file/${file.id}`),
            method: 'post'
          })
        }).then(({data}) => {
          if (data && data.code === 0) {
            this.$message.success('删除成功')
            this.loadDetail(this.dataForm.id)
            this.getDataList()
          } else {
            this.$message.error((data && data.msg) || '删除失败')
          }
        }).catch(() => {
        }).finally(() => {
          this.submitLoading = false
        })
      },
      downloadFile (file) {
        const token = this.$cookie.get('token') || ''
        window.open(this.$http.adornUrl(`/erp/manual-expense/download/file/${file.id}?token=${encodeURIComponent(token)}`), '_blank')
      },
      dateText (value) {
        return value ? String(value).substring(0, 10) : '-'
      },
      moneyText (value) {
        const num = Number(value || 0)
        return num.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      }
    }
  }
</script>

<style scoped>
  .mod-erp-manual-expense .query-form {
    margin-top: 15px;
  }

  .mod-erp-manual-expense .el-pagination {
    margin-top: 15px;
    text-align: right;
  }
</style>
