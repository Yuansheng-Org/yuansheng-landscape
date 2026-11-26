(() => {
  "use strict";

  // 名称和分类沿用飞书表格顺序。第三列为新增软件的演示评级。
  const rows = [
    ["KVM", "操作系统内核与驱动层", 3],
    ["StratoVirt", "云计算/云原生", 3],
    ["Docker", "基础服务与中间件层", 3],
    ["iSulad", "云计算/云原生", 2],
    ["Kubernetes", "基础服务与中间件层", 2],
    ["Helm", "云计算/云原生", 3],
    ["Istio", "云计算/云原生", 2],
    ["Prometheus", "基础服务与中间件层", 3],
    ["Grafana", "基础服务与中间件层", 2],
    ["OpenCV", "基础库及系统工具层"],
    ["FFmpeg", "基础库及系统工具层"],
    ["scikit-learn", "智能计算", 2],
    ["Apache Spark MLlib", "智能计算", 1],
    ["CNTK", "智能计算", 0],
    ["Deeplearning4j", "智能计算", 1],
    ["Apache Mahout", "智能计算", 1],
    ["PyTorch", "基础服务与中间件层", 2],
    ["MXNet", "智能计算", 0],
    ["Caffe", "智能计算", 1],
    ["Hadoop", "大数据框架", 2],
    ["OpenSSL", "基础库及系统工具层", 4],
    ["musl libc", "基础库及系统工具层", 4],
    ["OpenSSH", "基础库及系统工具层", 3],
    ["glibc", "基础库及系统工具层"],
    ["OpenJDK", "编译工具链及语言运行时层"],
    ["Python", "编译工具链及语言运行时层"],
    ["Go", "编译工具链及语言运行时层"],
    ["OpenBLAS", "基础库及系统工具层", 3],
    ["TensorFlow", "基础服务与中间件层", 2],
    ["MNN", "智能计算", 2],
    ["ONNX", "智能计算", 3],
    ["vLLM", "智能计算", 1],
    ["Vulkan", "多媒体与图形", 1],
    ["Flink", "大数据框架", 2],
    ["MySQL", "基础服务与中间件层", 3],
    ["MariaDB", "基础服务与中间件层"],
    ["Storm", "大数据框架", 1],
    ["PostgreSQL", "基础服务与中间件层"],
    ["Elasticsearch", "大数据框架", 2],
    ["Tez", "大数据框架", 1],
    ["Kafka", "大数据框架", 3],
    ["Redis", "基础服务与中间件层"],
    ["Spark", "大数据框架", 2],
    ["ZooKeeper", "大数据框架", 2],
    ["Faiss", "基础库及系统工具层", 2],
    ["ONNX Runtime", "基础服务与中间件层", 2],
    ["pixman", "基础库及系统工具层", 3],
    ["Numpy", "基础库及系统工具层", 3],
    ["Nginx", "基础服务与中间件层", 3],
    ["oneDNN", "智能计算", 1],
    ["UEFI", "固件与引导层", 1],
    ["OpenSBI", "固件与引导层"],
    ["Linux Kernel", "操作系统内核与驱动层"],
    ["GCC", "编译工具链及语言运行时层"],
    ["LLVM", "编译工具链及语言运行时层"],
    ["QEMU", "基础服务与中间件层"],
    ["Spike", "编译工具链及语言运行时层", 4],
    ["GDB", "编译工具链及语言运行时层", 3],
    ["openGauss", "大数据框架", 2],
  ];

  // 五个维度按 data.js 中的顺序设置示例基准。每对数字分别为得分和维度等级。
  const dimensionProfiles = [
    [[100, 4], [0, 0], [0, 0], [0, 0], [0, 0]],
    [[100, 4], [76, 1], [58, 1], [68, 1], [60, 3]],
    [[100, 4], [92, 4], [74, 2], [77, 2], [60, 3]],
    [[100, 4], [96, 4], [85, 3], [87, 3], [80, 3]],
    [[100, 4], [98, 4], [95, 4], [96, 4], [100, 4]],
  ];
  const { packages: examplePackages, dimensions } = window.LandscapeData;
  const previousExamples = new Map(examplePackages.map((item) => [item.id, item]));
  const performanceSamples = window.SoftwarePerformanceSamples;

  // 各阶段互斥。已优化软件也计入已适配和已评估的累计数量。
  const stages = {
    optimized: { id: "optimized", label: "已优化", adapted: true, assessed: true },
    assessed: { id: "assessed", label: "已评估待优化", adapted: true, assessed: true },
    adapted: { id: "adapted", label: "已适配待评估", adapted: true, assessed: false },
    adapting: { id: "adapting", label: "适配中", adapted: false, assessed: false },
  };
  const adapting = ["cntk", "mxnet", "vllm", "uefi"];
  const adapted = ["deeplearning4j", "apache-mahout", "caffe", "vulkan", "onednn"];
  const stageOverrides = new Map([
    ...adapting.map((id) => [id, stages.adapting]),
    ...adapted.map((id) => [id, stages.adapted]),
  ]);

  // 模拟优化记录沿用当前首项测试的读数和性能先进性得分作为优化后值。
  const optimizationSamples = new Map([
    ["kvm", ["减少 vCPU 启动时的线程唤醒和设备初始化等待", 3.34, true, 6]],
    ["stratovirt", ["合并虚拟设备初始化步骤，减少启动阶段的串行等待", 1.90, true, 8]],
    ["docker", ["复用已拉取镜像的层元数据，缩短容器初始化", 259, true, 6]],
    ["isulad", ["减少容器启动时重复读取配置和状态文件", 181, true, 7]],
    ["helm", ["在单次渲染中复用模板解析结果，减少重复的格式转换", 116, true, 5]],
    ["prometheus", ["批量读取时间序列样本，减少区间聚合的临时内存分配", 131, true, 7]],
    ["opencv", ["使用 RVV 加速高斯模糊的横向与纵向卷积", 6.61, true, 8]],
    ["ffmpeg", ["使用 RVV 加速 H.264 解码的像素预测与反变换", 96, false, 7]],
    ["openssl", ["减少 AES-GCM 分组处理中的临时缓冲复制", 678, false, 8]],
    ["openssh", ["批量提交 SFTP 写请求，减少单连接上传时的等待", 145, false, 6]],
    ["glibc", ["为长块 memcpy 调整 RVV 向量循环与尾块处理", 10.8, false, 6]],
    ["python", ["复用 JSON 编码输出缓冲，减少序列化的临时对象", 11900, false, 7]],
    ["openblas", ["调整 FP64 DGEMM 分块尺寸并优化 RVV 微内核", 10.9, false, 8]],
    ["mysql", ["减少只读事务中热点索引页的重复定位和缓冲区争用", 4570, false, 6]],
    ["postgresql", ["减少只读查询执行过程中的临时内存分配", 24100, false, 6]],
    ["redis", ["复用流水线响应缓冲，减少批量 GET 的系统调用", 282000, false, 7]],
    ["nginx", ["使用 sendfile 传输静态文件，减少用户态数据复制", 18600, false, 6]],
    ["linux-kernel", ["缩短管道读写的任务唤醒路径，减少调度等待", 5.9, true, 7]],
    ["gcc", ["复用预编译头文件，减少并行构建的重复解析", 36.2, true, 6]],
    ["qemu", ["调整 TCG 基本块链接，减少客体启动期间的重复翻译", 9.4, true, 7]],
  ]);
  const performanceDimensionIndex = 2;

  function optimizationFor(id, benchmark, scores) {
    const sample = optimizationSamples.get(id);
    if (!sample) return undefined;

    const [summary, baseline, lowerIsBetter, pointGain] = sample;
    const { name, metric, unit, target } = benchmark;
    const score = scores[performanceDimensionIndex].score;
    return {
      summary,
      performance: { name, metric, unit, before: baseline, after: target, lowerIsBetter },
      maturity: { name: dimensions[performanceDimensionIndex], before: score - pointGain, after: score },
    };
  }

  window.SoftwareProgressStages = Object.values(stages);
  window.SoftwareCatalog = rows.map(([name, layer, demoLevel]) => {
    const id = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const example = previousExamples.get(id);
    const level = example?.level ?? demoLevel;
    const seed = [...id].reduce((sum, character) => sum + character.charCodeAt(0), 0);
    const scores = dimensionProfiles[level].map(([baseScore, dimensionLevel], index) => {
      const previous = example?.scores[index];
      if (Number.isFinite(previous?.score)) return previous;

      const variation = (seed + index * 3) % 5 - 2;
      const score = baseScore === 0 || baseScore === 100 ? baseScore : baseScore + variation;
      return { score, level: dimensionLevel };
    });

    const tests = example?.tests ?? performanceSamples.get(id) ?? [];
    const optimization = optimizationFor(id, tests[0], scores);
    const stage = optimization ? stages.optimized : stageOverrides.get(id) ?? stages.assessed;
    return { id, mark: name.slice(0, 2).toUpperCase(), name, layer, level, scores, tests, stage, optimization };
  });
})();
