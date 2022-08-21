margin = ({ top: 20, right: 30, bottom: 34, left: 0 });
width = document.documentElement.clientWidth;
height = document.documentElement.clientHeight - margin.top - margin.bottom;

delay = 250

yearMin = d3.min(data, d => d.year)

yearStep = 1

x = d3.scaleBand()
  .domain(Array.from(d3.group(data, d => d.age).keys()).sort(d3.ascending))
  .range([width - margin.right, margin.left])

y = d3.scaleLinear()
  .domain([0, d3.max(data, d => d.value)])
  .range([height - margin.bottom, margin.top])

color = d3.scaleOrdinal(["M", "F"], ["#4e79a7", "#e15759"])

xAxis = g => g
  .attr("transform", `translate(0,${height - margin.bottom})`)
  .call(d3.axisBottom(x)
    .tickValues(d3.ticks(...d3.extent(data, d => d.age), width / 40))
    .tickSizeOuter(0))
  .call(g => g.append("text")
    .attr("x", margin.right)
    .attr("y", margin.bottom - 4)
    .attr("fill", "currentColor")
    .attr("text-anchor", "end")
    .text(data.x))

yAxis = g => g
  .attr("transform", `translate(${width - margin.right},0)`)
  .call(d3.axisRight(y).ticks(null, "s"))
  .call(g => g.select(".domain").remove())
  .call(g => g.append("text")
    .attr("x", margin.right)
    .attr("y", 10)
    .attr("fill", "currentColor")
    .attr("text-anchor", "end")
    .text(data.y))



let svg = d3.select("svg").attr("viewBox", [0, 0, width, height]);

svg.append("g")
  .call(xAxis);

svg.append("g")
  .call(yAxis);

const group = svg.append("g");

let rect = group.selectAll("rect");

const update = (year) => {
  const dx = x.step() * (year - yearMin) / yearStep;

  const t = svg.transition()
    .ease(d3.easeLinear)
    .duration(delay);

  rect = rect
    .data(data.filter(d => d.year === year), d => `${d.sex}:${d.year - d.age}`)
    .join(
      enter => enter.append("rect")
        .style("mix-blend-mode", "darken")
        .attr("fill", d => color(d.sex))
        .attr("x", d => x(d.age) + dx)
        .attr("y", d => y(0))
        .attr("width", x.bandwidth() + 1)
        .attr("height", 0),
      update => update,
      exit => exit.call(rect => rect.transition(t).remove()
        .attr("y", y(0))
        .attr("height", 0))
    );

  rect.transition(t)
    .attr("y", d => y(d.value))
    .attr("height", d => y(0) - y(d.value));

  group.transition(t)
    .attr("transform", `translate(${-dx},0)`);
};

update(yearMin)
