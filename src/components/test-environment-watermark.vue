<template>
  <div class="test-environment-watermark" aria-hidden="true">
    <span v-for="index in 15" :key="index">测试环境</span>
  </div>
</template>

<script>
  export default {
    name: 'TestEnvironmentWatermark'
  }
</script>

<style lang="scss" scoped>
  .test-environment-watermark {
    position: fixed;
    top: 50px;
    right: 0;
    bottom: 0;
    left: 0;
    z-index: 1020;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    grid-auto-rows: minmax(150px, 1fr);
    align-items: center;
    justify-items: center;
    overflow: hidden;
    pointer-events: none;
    user-select: none;

    span {
      color: rgba(220, 74, 45, .09);
      font-size: 34px;
      font-weight: 700;
      letter-spacing: 8px;
      white-space: nowrap;
      transform: rotate(-24deg);
    }
  }

  @media (max-width: 768px) {
    .test-environment-watermark {
      grid-template-columns: repeat(2, 1fr);
      grid-auto-rows: minmax(120px, 1fr);

      span {
        font-size: 24px;
        letter-spacing: 5px;
      }
    }
  }
</style>
