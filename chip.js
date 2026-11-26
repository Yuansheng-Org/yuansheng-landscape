(() => {
  const canvas = document.getElementById('chip-art');
  const ctx = canvas?.getContext('2d');
  if (!ctx) return;

  const width = 560;
  const height = 250;
  const origin = { x: 322, y: 132 };
  const amber = '#995d31';
  const amberLine = '#9c622c';
  const teal = '#2a8077';

  ctx.scale(canvas.width / width, canvas.height / height);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  function project([x, y, z = 0]) {
    return [origin.x + (x - y) * 0.93, origin.y + (x + y) * 0.46 - z];
  }

  function path(points) {
    ctx.beginPath();
    points.map(project).forEach(([x, y], index) => {
      if (index === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
  }

  function line(points, color, lineWidth, alpha = 1) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    path(points);
    ctx.stroke();
    ctx.restore();
  }

  function face(points, fill, stroke, alpha = 1) {
    ctx.save();
    ctx.globalAlpha = alpha;
    path(points);
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 0.85;
      ctx.stroke();
    }
    ctx.restore();
  }

  function plate(x0, y0, x1, y1, z) {
    return [[x0, y0, z], [x1, y0, z], [x1, y1, z], [x0, y1, z]];
  }

  function via(point, color, radius, alpha) {
    const [x, y] = project(point);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.ellipse(x, y, radius, radius * 0.6, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#f4f6fb';
    ctx.fill();
    ctx.lineWidth = 0.75;
    ctx.strokeStyle = color;
    ctx.stroke();
    ctx.restore();
  }

  function turn(x, y, side, height = 0) {
    const points = [[x, y], [-y, x], [-x, -y], [y, -x]];
    return [...points[side], height];
  }

  function drawPackage(size, top, bottom, fills, outline) {
    const [back, right, front, left] = plate(-size, -size, size, size, top);
    const [,, frontBase, leftBase] = plate(-size, -size, size, size, bottom);
    const rightBase = [size, -size, bottom];
    face([right, front, frontBase, rightBase], fills[1], outline);
    face([front, left, leftBase, frontBase], fills[2], outline);
    face([back, right, front, left], fills[0], outline);
  }

  const light = ctx.createRadialGradient(origin.x, origin.y, 20, origin.x, origin.y, 206);
  light.addColorStop(0, 'rgba(210, 152, 59, 0.13)');
  light.addColorStop(0.7, 'rgba(151, 104, 32, 0.04)');
  light.addColorStop(1, 'rgba(151, 104, 32, 0)');
  ctx.fillStyle = light;
  ctx.fillRect(0, 0, width, height);

  // The traces run outward from each package edge through straight PCB lanes.
  for (let side = 0; side < 4; side += 1) {
    for (let index = 0; index < 10; index += 1) {
      const lane = -40.5 + index * 9;
      const direction = index < 5 ? -1 : 1;
      const offset = direction * (12 + (index % 3) * 4);
      const bend = 76 + (index % 5) * 6;
      const end = 116 + (index % 5) * 9 + (side % 2) * 6;
      const highlight = index === 2 || index === 7;
      const color = highlight && side % 2 === 1 ? teal : amberLine;
      const opacity = highlight ? 0.63 : 0.27;
      const points = [
        [57, lane], [bend, lane], [bend + Math.abs(offset), lane + offset],
        [end, lane + offset],
      ].map(([x, y]) => turn(x, y, side));
      line(points, color, highlight ? 1.05 : 0.74, opacity);
      via(turn(end, lane + offset, side), color, highlight ? 2.4 : 1.65, opacity);
    }
  }

  const cornerMarks = [[106, 65], [137, 67], [-99, 79], [-125, 65], [83, -85], [-108, -72]];
  cornerMarks.forEach(([x, y], index) => {
    const color = index % 3 === 0 ? teal : amberLine;
    line([[x + 9, y], [x, y], [x, y + 9]], color, 0.8, 0.36);
    via([x + 5, y + 5], color, 1.15, 0.5);
  });

  // Solder pads, package leads, and the ceramic body occupy different planes.
  for (let side = 0; side < 4; side += 1) {
    for (let index = 0; index < 10; index += 1) {
      const lane = -40.5 + index * 9;
      const pad = plate(48, lane - 1.75, 58.5, lane + 1.75, 0);
      face(pad.map(([x, y, z]) => turn(x, y, side, z)), '#caad87', '#b18046', 0.8);
      const lead = [[48, lane, 7], [52, lane, 7], [56, lane, 1], [58, lane, 1]];
      line(lead.map(([x, y, z]) => turn(x, y, side, z)), amber, 1, 0.86);
    }
  }

  const lid = ctx.createLinearGradient(origin.x - 73, origin.y - 54, origin.x + 67, origin.y + 35);
  lid.addColorStop(0, '#fcf5e9');
  lid.addColorStop(0.55, '#f2e6cf');
  lid.addColorStop(1, '#e8cfaa');

  drawPackage(48, 9, 3, ['#dac2a0', '#ba976c', '#d0ab80'], '#b28247');
  drawPackage(45, 18, 9, [lid, '#bb9b70', '#dec29d'], '#ae7c44');

  const inset = plate(-36, -36, 36, 36, 18);
  face(inset, 'rgba(255, 250, 234, 0.68)', '#70573d');
  const register = [
    [[-40, -29, 18], [-40, -40, 18], [-28, -40, 18]],
    [[28, -40, 18], [40, -40, 18], [40, -29, 18]],
    [[40, 29, 18], [40, 40, 18], [28, 40, 18]],
    [[-28, 40, 18], [-40, 40, 18], [-40, 29, 18]],
  ];
  register.forEach(points => line(points, amber, 0.85, 0.86));

  via([-34, 31, 18], amber, 2, 0.9);
  via([-29, 31, 18], amber, 1.05, 0.5);

  const [labelX, labelY] = project([0, 0, 18]);
  ctx.save();
  ctx.transform(0.93, 0.46, -0.93, 0.46, labelX, labelY);
  ctx.font = '700 18px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = amber;
  ctx.fillText('RISC-V', 0, -1);
  ctx.strokeStyle = '#a0794d';
  ctx.lineWidth = 0.7;
  ctx.beginPath();
  ctx.moveTo(-19, 13);
  ctx.lineTo(19, 13);
  ctx.stroke();
  ctx.restore();
})();
