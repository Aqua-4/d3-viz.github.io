margin = ({ top: 20, right: 30, bottom: 34, left: 0 });
width = document.documentElement.clientWidth;
height = document.documentElement.clientHeight - margin.top - margin.bottom;

delay = 250

const [yearMin, yearMax] = d3.extent(data, d => d.year)
var timer;

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

const svg = d3.select("svg").attr("viewBox", [0, 0, width, height]);

svg.append("g")
  .call(xAxis);

svg.append("g")
  .call(yAxis);

const group = svg.append("g");


const update = (year) => {
  const dx = x.step() * (year - yearMin) / yearStep;

  const t = svg.transition()
    .ease(d3.easeLinear)
    .duration(delay);

  let rect = group.selectAll("rect");

  rect = rect
    .data(data.filter(d => d.year === year), d => `${d.sex}:${d.year - d.age}`)
    .join(
      enter => enter.append("rect")
        .style("mix-blend-mode", "darken")
        .attr("fill", d => color(d.sex))
        .attr("data-legend", function (d) { return d.age })
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

update(yearMin);

const applyLegend = (legendKeys) => {
  //Initialize legend
  var legendItemSize = 12;
  var legendSpacing = 4;
  var xOffset = 0;
  var yOffset = 0;
  const legend = svg
    // .append('#legend')
    .append('g')
    .attr('class', 'legendContainer')
    .selectAll('.legendItem')
    .data(legendKeys);

  //Create legend items
  legend
    .enter()
    .append('rect')
    .attr('class', 'legendItem')
    .attr('width', legendItemSize)
    .attr('height', legendItemSize)
    .style("mix-blend-mode", "darken")
    .style('fill', d => color(d))
    .attr('transform',
      (d, i) => {
        var x = xOffset;
        var y = yOffset + (legendItemSize + legendSpacing) * i;
        return `translate(${x}, ${y})`;
      });

  //Create legend labels
  legend
    .enter()
    .append('text')
    .attr('x', xOffset + legendItemSize + 5)
    .attr('y', (d, i) => yOffset + (legendItemSize + legendSpacing) * i + 12)
    .text(d => d);

}

applyLegend(['M', 'F']);




////////// slider //////////
const sliderMargin = ({ top: 20, right: 20, bottom: 20, left: 20 });

var formatDateIntoYear = d3.timeFormat("%Y");
var formatDate = d3.timeFormat("%b %Y");
var parseDate = d3.timeParse("%Y");


var moving = false;
var currentValue = 0;
var targetValue = width;

var playButton = d3.select("#play-button");

var sliderX = d3.scaleTime()
  .domain([parseDate(yearMin), parseDate(yearMax)])
  .range([sliderMargin.left, width - sliderMargin.right - sliderMargin.left])
  .clamp(true);

console.log(sliderX.domain());

var slider = svg.append("g")
  .attr("class", "slider")
  .attr("transform", `translate(${sliderMargin.left},${sliderMargin.top})`)

slider.append("line")
  .attr("class", "track")
  .attr("x1", sliderX.range()[0])
  .attr("x2", sliderX.range()[1])
  .select(function () { return this.parentNode.appendChild(this.cloneNode(true)); })
  .attr("class", "track-inset")
  .select(function () { return this.parentNode.appendChild(this.cloneNode(true)); })
  .attr("class", "track-overlay")
  .call(d3.drag()
    .on("start.interrupt", function () { slider.interrupt(); })
    .on("start drag", function (event) {
      currentValue = event.x;
      const selectedYear = formatDateIntoYear(sliderX.invert(currentValue));
      updateSlider(selectedYear);
      console.log((selectedYear));
      update(selectedYear);
    })
  );

slider.insert("g", ".track-overlay")
  .attr("class", "ticks")
  .attr("transform", `translate(${sliderMargin.left},${sliderMargin.top})`)
  .selectAll("text")
  .data(sliderX.ticks(10))
  .enter()
  .append("text")
  .attr("x", sliderX)
  .attr("y", 10)
  .attr("text-anchor", "middle")
  .text(function (d) {
    return formatDateIntoYear(d);
  });

var handle = slider.insert("circle", ".track-overlay")
  .attr("class", "handle")
  .attr("cx", sliderX.range()[0])
  .attr("r", 9);

var label = slider.append("text")
  .attr("class", "label")
  .attr("text-anchor", "middle")
  .text(formatDate(yearMin))
  .attr("transform", `translate(${sliderMargin.left},${sliderMargin.top})`)

function updateSlider(year) {
  // update position and text of label according to slider scale
  const formattedYear = parseDate(year)
  handle
    .attr("cx", sliderX(formattedYear));

  label
    .attr("x", sliderX(formattedYear))
    .text(year);
}

// play //
playButton
  .on("click", function () {
    var button = d3.select(this);
    if (button.text() == "Pause") {
      moving = false;
      clearInterval(timer);
      button.text("Play");
    } else {
      moving = true;
      timer = setInterval(step, 500);
      button.text("Pause");
    }
    console.log("Slider moving: " + moving);
  })

// TODO: needs some work
function step() {
  const selectedYear = formatDateIntoYear(sliderX.invert(currentValue));
  updateSlider(selectedYear);
  update(selectedYear);

  currentValue = currentValue + (targetValue / 151);
  if (currentValue > targetValue) {
    moving = false;
    currentValue = 0;
    clearInterval(timer);
    // timer = 0;
    playButton.text("Play");
    console.log("Slider moving: " + moving);
  }
};
