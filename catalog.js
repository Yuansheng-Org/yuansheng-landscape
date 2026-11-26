(() => {
  "use strict";

  // 名称和分类沿用飞书表格顺序。
  const rows = [
    ["KVM", "操作系统内核与驱动层"],
    ["StratoVirt", "云计算/云原生"],
    ["Docker", "基础服务与中间件层"],
    ["iSulad", "云计算/云原生"],
    ["Kubernetes", "基础服务与中间件层"],
    ["Helm", "云计算/云原生"],
    ["Istio", "云计算/云原生"],
    ["Prometheus", "基础服务与中间件层"],
    ["Grafana", "基础服务与中间件层"],
    ["OpenCV", "基础库及系统工具层"],
    ["FFmpeg", "基础库及系统工具层"],
    ["scikit-learn", "智能计算"],
    ["Apache Spark MLlib", "智能计算"],
    ["CNTK", "智能计算"],
    ["Deeplearning4j", "智能计算"],
    ["Apache Mahout", "智能计算"],
    ["PyTorch", "基础服务与中间件层"],
    ["MXNet", "智能计算"],
    ["Caffe", "智能计算"],
    ["Hadoop", "大数据框架"],
    ["OpenSSL", "基础库及系统工具层"],
    ["musl libc", "基础库及系统工具层"],
    ["OpenSSH", "基础库及系统工具层"],
    ["glibc", "基础库及系统工具层"],
    ["OpenJDK", "编译工具链及语言运行时层"],
    ["Python", "编译工具链及语言运行时层"],
    ["Go", "编译工具链及语言运行时层"],
    ["OpenBLAS", "基础库及系统工具层"],
    ["TensorFlow", "基础服务与中间件层"],
    ["MNN", "智能计算"],
    ["ONNX", "智能计算"],
    ["vLLM", "智能计算"],
    ["Vulkan", "多媒体与图形"],
    ["Flink", "大数据框架"],
    ["MySQL", "基础服务与中间件层"],
    ["MariaDB", "基础服务与中间件层"],
    ["Storm", "大数据框架"],
    ["PostgreSQL", "基础服务与中间件层"],
    ["Elasticsearch", "大数据框架"],
    ["Tez", "大数据框架"],
    ["Kafka", "大数据框架"],
    ["Redis", "基础服务与中间件层"],
    ["Spark", "大数据框架"],
    ["ZooKeeper", "大数据框架"],
    ["Faiss", "基础库及系统工具层"],
    ["ONNX Runtime", "基础服务与中间件层"],
    ["pixman", "基础库及系统工具层"],
    ["Numpy", "基础库及系统工具层"],
    ["Nginx", "基础服务与中间件层"],
    ["oneDNN", "智能计算"],
    ["UEFI", "固件与引导层"],
    ["OpenSBI", "固件与引导层"],
    ["Linux Kernel", "操作系统内核与驱动层"],
    ["GCC", "编译工具链及语言运行时层"],
    ["LLVM", "编译工具链及语言运行时层"],
    ["QEMU", "基础服务与中间件层"],
    ["Spike", "编译工具链及语言运行时层"],
    ["GDB", "编译工具链及语言运行时层"],
    ["openGauss", "大数据框架"],
  ];

  const catalog = new Map(rows.map(([name, layer]) => {
    const id = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    return [id, { id, name, layer, mark: name.slice(0, 2).toUpperCase(), reports: [] }];
  }));
  for (const report of window.LandscapeReports) {
    const id = report.software_id;
    if (!catalog.has(id)) {
      catalog.set(id, { id, name: report.name, layer: "其他软件", mark: report.name.slice(0, 2), reports: [] });
    }
    catalog.get(id).reports.push(report);
  }

  const stages = {
    assessed: { id: "assessed", label: "已确认评级", assessed: true },
    measured: { id: "measured", label: "有记录待确认评级", assessed: false },
    pending: { id: "pending", label: "暂无实测记录", assessed: false },
  };
  window.SoftwareProgressStages = Object.values(stages);
  window.SoftwareCatalog = [...catalog.values()].map((pkg) => {
    pkg.reports.sort((a, b) => b.date.localeCompare(a.date)
      || (b.assessment?.id ?? 0) - (a.assessment?.id ?? 0)
      || (b.assessment?.revision ?? 0) - (a.assessment?.revision ?? 0)
      || a.id.localeCompare(b.id));
    const rated = pkg.reports.find((r) => r.assessment?.confirmed);
    const current = rated ?? pkg.reports[0];
    return { ...pkg, current, level: rated ? Number(rated.assessment.level.slice(1)) : null,
      stage: rated ? stages.assessed : current ? stages.measured : stages.pending,
      platforms: current?.platforms ?? {} };
  });
})();
