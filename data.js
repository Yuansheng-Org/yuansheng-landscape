(() => {
  "use strict";

  const levels = [
    { name: "未移植", description: "RISC-V 目标配置的构建失败，并有明确的失败记录。" },
    { name: "仅移植", description: "能够在目标配置上构建并运行，核心功能初步可用。" },
    { name: "适配可用", description: "满足仅移植要求，核心功能完整性和开源社区支持达到要求。" },
    { name: "商业就绪", description: "满足适配可用要求，适用的性能、稳定性和指令集架构配置兼容性达到要求。" },
    { name: "原生优化", description: "满足商业就绪要求，在 RISC-V 原生环境直接执行并针对架构特性优化，达到更高的性能和稳定性要求。" },
  ];

  const layers = [
    "固件与引导层",
    "操作系统内核与驱动层",
    "基础库及系统工具层",
    "编译工具链及语言运行时层",
    "基础服务与中间件层",
  ];

  const dimensions = [
    "开源社区记录审查",
    "功能完整性测试",
    "性能先进性测试",
    "运行稳定性测试",
    "指令集架构配置兼容性测试",
  ];

  const platforms = { target: "SOPHON SG2044", reference: "Ampere Altra Max" };
  const platformRows = [
    { label: "Processor Model", ...platforms },
    { label: "Microarchitecture", target: "T-Head C920v2", reference: "ARM Neoverse N1" },
    { label: "Core Count", target: "64", reference: "128（使用 64）" },
    { label: "Frequency", target: "2.6 GHz", reference: "2.6 GHz" },
    { label: "Vector Extension", target: "RVV v1.0", reference: "NEON" },
    { label: "Memory", target: "128 GB DDR5-4266", reference: "128 GB DDR4-3200" },
    { label: "PCIe Bus", target: "PCIe Gen5", reference: "PCIe Gen4" },
    { label: "OS", target: "openEuler 24.03", reference: "openEuler 24.03" },
    { label: "Kernel Version", target: "Linux 6.6.0", reference: "Linux 6.6.0" },
    { label: "Compiler", target: "LLVM 17", reference: "LLVM 17" },
  ];

  const [firmware, kernel, system, toolchain, services] = layers;
  const performanceSamples = window.SoftwarePerformanceSamples;

  // 软件评级、五项评分和性能读数均为演示数据。五维顺序与 dimensions 一致。
  // 每对数字分别为演示分数和该维度展示等级。
  const packages = [
    {
      id: "opencv", name: "OpenCV", mark: "CV", layer: system, level: 3,
      summary: "开源计算机视觉库，提供图像处理、视频分析和视觉算法。",
      homepage: "https://opencv.org/",
      scores: [[100, 4], [95, 4], [84, 3], [88, 3], [80, 3]],
      tests: [
        { name: "高斯模糊（1920 × 1080）", metric: "平均耗时", unit: "ms", target: 5.42, reference: 4.81 },
        { name: "双线性图像缩放", metric: "平均耗时", unit: "ms", target: 2.16, reference: 2.38 },
        { name: "矩阵乘法（1024 × 1024）", metric: "平均耗时", unit: "ms", target: 8.34, reference: 6.97 },
        { name: "DNN 图像推理", metric: "平均耗时", unit: "ms", target: 34.52, reference: 29.16 },
      ],
    },
    {
      id: "linux-kernel", name: "Linux Kernel", mark: "LK", layer: kernel, level: 4,
      summary: "Linux 内核，提供进程调度、内存管理和设备驱动等基础能力。",
      homepage: "https://www.kernel.org/",
      scores: [[100, 4], [99, 4], [94, 4], [98, 4], [100, 4]],
      tests: [
        { name: "管道往返", metric: "平均延迟", unit: "μs", target: 4.8, reference: 4.5 },
        { name: "Unix 域套接字传输", metric: "平均吞吐量", unit: "MB/s", target: 5120, reference: 5080 },
      ],
    },
    {
      id: "python", name: "Python", mark: "Py", layer: toolchain, level: 4,
      summary: "通用编程语言，提供跨平台解释器和丰富的标准库。",
      homepage: "https://www.python.org/",
      scores: [[100, 4], [99, 4], [92, 4], [96, 4], [100, 4]],
      tests: [
        { name: "JSON 序列化", metric: "平均吞吐量", unit: "ops/s", target: 14200, reference: 13500 },
        { name: "正则表达式匹配", metric: "平均耗时", unit: "ms", target: 7.8, reference: 7.2 },
      ],
    },
    {
      id: "llvm", name: "LLVM", mark: "LL", layer: toolchain, level: 3,
      summary: "模块化编译器工具链，提供中间表示、代码优化和目标架构代码生成。",
      homepage: "https://llvm.org/",
      scores: [[100, 4], [97, 4], [86, 3], [87, 3], [80, 3]],
      tests: [
        { name: "C++ 示例项目完整编译", metric: "平均耗时", unit: "s", target: 12.4, reference: 10.8 },
      ],
    },
    {
      id: "postgresql", name: "PostgreSQL", mark: "Pg", layer: services, level: 3,
      summary: "开源关系型数据库，支持事务、复杂查询和可扩展的数据类型。",
      homepage: "https://www.postgresql.org/",
      scores: [[100, 4], [96, 4], [85, 3], [88, 3], [60, 3]],
      tests: [
        { name: "pgbench 只读事务", metric: "事务吞吐量", unit: "TPS", target: 28100, reference: 30400 },
        { name: "pgbench 读写事务", metric: "平均延迟", unit: "ms", target: 3.87, reference: 3.49 },
      ],
    },
    {
      id: "qemu", name: "QEMU", mark: "QE", layer: system, level: 4,
      summary: "机器模拟与虚拟化工具，提供全系统和用户态模拟。",
      homepage: "https://www.qemu.org/",
      scores: [[100, 4], [98, 4], [93, 4], [96, 4], [100, 4]],
    },
    {
      id: "opensbi", name: "OpenSBI", mark: "OS", layer: firmware, level: 3,
      summary: "RISC-V Supervisor Binary Interface 的开源实现。",
      homepage: "https://github.com/riscv-software-src/opensbi",
      scores: [[100, 4], [100, 4], [86, 3], [91, 4], [80, 3]],
      tests: [
        { name: "固件调用往返（RISC-V SBI／ARM SMC）", metric: "平均延迟", unit: "μs", target: 0.82, reference: 0.76 },
      ],
    },
    {
      id: "u-boot", name: "U-Boot", mark: "UB", layer: firmware, level: 2,
      summary: "开源引导程序，支持嵌入式设备初始化和操作系统启动。",
      homepage: "https://docs.u-boot.org/",
      scores: [[100, 4], [94, 4], [72, 2], [77, 2], [60, 3]],
    },
    {
      id: "barebox", name: "barebox", mark: "Bb", layer: firmware, level: 0,
      summary: "面向嵌入式设备的开源引导程序，提供命令行和设备管理。",
      homepage: "https://www.barebox.org/",
      scores: [[100, 4], [0, 0], [0, 0], [0, 0], [0, 0]],
    },
    {
      id: "freebsd-kernel", name: "FreeBSD Kernel", mark: "FB", layer: kernel, level: 1,
      summary: "FreeBSD 操作系统内核，负责进程、内存、网络和设备管理。",
      homepage: "https://www.freebsd.org/",
      scores: [[100, 4], [73, 1], [58, 1], [66, 1], [60, 3]],
    },
    {
      id: "virtio-drivers", name: "Linux VirtIO Drivers", mark: "VI", layer: kernel, level: 3,
      summary: "Linux 内核中的 VirtIO 驱动，支持虚拟化环境下的网络、存储等设备。",
      homepage: "https://docs.kernel.org/driver-api/virtio/virtio.html",
      scores: [[100, 4], [97, 4], [88, 3], [90, 4], [80, 3]],
    },
    {
      id: "ffmpeg", name: "FFmpeg", mark: "FF", layer: system, level: 3,
      summary: "用于音视频编解码、格式转换和滤镜处理的工具与库。",
      homepage: "https://ffmpeg.org/",
      scores: [[100, 4], [96, 4], [84, 3], [89, 3], [80, 3]],
      tests: [
        { name: "1080p H.264 解码", metric: "解码吞吐量", unit: "fps", target: 118, reference: 132 },
      ],
    },
    {
      id: "glibc", name: "glibc", mark: "GL", layer: system, level: 4,
      summary: "GNU C 运行库，提供标准 C 库接口、动态链接器和系统调用封装。",
      homepage: "https://www.gnu.org/software/libc/",
      scores: [[100, 4], [99, 4], [94, 4], [97, 4], [100, 4]],
    },
    {
      id: "busybox", name: "BusyBox", mark: "BB", layer: system, level: 2,
      summary: "将常用 Unix 命令集成到一个可执行文件，常用于嵌入式和最小系统。",
      homepage: "https://busybox.net/",
      scores: [[100, 4], [93, 4], [82, 3], [79, 2], [60, 3]],
    },
    {
      id: "gcc", name: "GCC", mark: "GC", layer: toolchain, level: 4,
      summary: "GNU 编译器套件，支持 C、C++ 等语言及多种目标架构。",
      homepage: "https://gcc.gnu.org/",
      scores: [[100, 4], [99, 4], [95, 4], [97, 4], [100, 4]],
    },
    {
      id: "rust", name: "Rust", mark: "Rs", layer: toolchain, level: 2,
      summary: "强调内存安全和性能的系统编程语言，配套工具包括编译器和 Cargo。",
      homepage: "https://www.rust-lang.org/",
      scores: [[100, 4], [93, 4], [75, 2], [83, 3], [60, 3]],
    },
    {
      id: "go", name: "Go", mark: "Go", layer: toolchain, level: 2,
      summary: "支持并发编程的通用语言，常用于网络服务和命令行工具。",
      homepage: "https://go.dev/",
      scores: [[100, 4], [94, 4], [79, 2], [82, 3], [60, 3]],
    },
    {
      id: "node-js", name: "Node.js", mark: "JS", layer: toolchain, level: 2,
      summary: "基于 V8 的 JavaScript 运行时，常用于服务端应用和开发工具。",
      homepage: "https://nodejs.org/",
      scores: [[100, 4], [91, 4], [70, 2], [76, 2], [60, 3]],
    },
    {
      id: "openjdk", name: "OpenJDK", mark: "JDK", layer: toolchain, level: 1,
      summary: "Java 平台的开源实现，包含 Java 虚拟机、工具链和标准类库。",
      homepage: "https://openjdk.org/",
      scores: [[100, 4], [86, 1], [68, 2], [79, 2], [60, 3]],
      tests: [
        { name: "JSON 解析", metric: "平均吞吐量", unit: "ops/s", target: 18900, reference: 26100 },
        { name: "浮点运算", metric: "平均耗时", unit: "ms", target: 11.86, reference: 8.44 },
      ],
    },
    {
      id: "redis", name: "Redis", mark: "Re", layer: services, level: 3,
      summary: "内存数据结构存储，常用于缓存和实时数据处理。",
      homepage: "https://redis.io/",
      scores: [[100, 4], [98, 4], [87, 3], [89, 3], [80, 3]],
    },
    {
      id: "sqlite", name: "SQLite", mark: "SQ", layer: system, level: 4,
      summary: "嵌入应用进程的关系型数据库引擎，数据库通常存放在单一文件中。",
      homepage: "https://www.sqlite.org/",
      scores: [[100, 4], [99, 4], [92, 4], [96, 4], [100, 4]],
    },
    {
      id: "mariadb", name: "MariaDB", mark: "Ma", layer: services, level: 2,
      summary: "关系型数据库服务，支持 SQL、事务和多种存储引擎。",
      homepage: "https://mariadb.org/",
      scores: [[100, 4], [93, 4], [75, 2], [80, 3], [60, 3]],
    },
    {
      id: "podman", name: "Podman", mark: "Po", layer: system, level: 2,
      summary: "管理容器和容器组的工具，可运行符合 OCI 规范的容器镜像。",
      homepage: "https://podman.io/",
      scores: [[100, 4], [92, 4], [76, 2], [79, 2], [60, 3]],
    },
    {
      id: "containerd", name: "containerd", mark: "ct", layer: services, level: 3,
      summary: "管理镜像传输、存储和容器生命周期的容器运行时。",
      homepage: "https://containerd.io/",
      scores: [[100, 4], [96, 4], [85, 3], [87, 3], [80, 3]],
    },
  ].map(({ scores, tests, ...software }) => ({
    ...software,
    scores: scores.map(([score, level]) => ({ score, level })),
    tests: tests ?? performanceSamples.get(software.id) ?? [],
  }));

  // 组合和场景等级为预设演示结果。原型不依据组件列表推导场景等级。
  const scenarios = [
    {
      id: "general-server", name: "通用服务器场景", level: 3,
      componentIds: ["opensbi", "linux-kernel", "glibc", "gcc", "postgresql"],
    },
    {
      id: "ai-server", name: "AI服务器场景", level: 3,
      componentIds: ["opensbi", "linux-kernel", "opencv", "python", "containerd"],
    },
    {
      id: "pc", name: "PC场景", level: 2,
      componentIds: ["u-boot", "linux-kernel", "glibc", "ffmpeg", "llvm"],
    },
    {
      id: "data-center", name: "数据中心场景", level: 2,
      componentIds: ["opensbi", "linux-kernel", "qemu", "podman", "redis"],
    },
    {
      id: "supernode-server", name: "超节点服务器场景", level: 2,
      componentIds: ["opensbi", "linux-kernel", "virtio-drivers", "qemu", "containerd"],
    },
    {
      id: "embodied-ai", name: "具身智能主计算平台场景", level: 0,
      componentIds: ["barebox", "linux-kernel", "opencv", "python", "redis"],
    },
  ];

  window.LandscapeData = { packages, levels, layers, dimensions, platformRows, scenarios, platforms };
})();
