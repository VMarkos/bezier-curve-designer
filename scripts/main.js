const XMLNS = "http://www.w3.org/2000/svg";

const eventListeners = {
    document: {},
};

let startPoint, endPoint;

const controls = [];

const R = 12;
const r = 8;

function getSVGPointer(event) {
    const svg = document.getElementById("svg-container");
    let pt = new DOMPoint();
    pt.x = event.clientX;
    pt.y = event.clientY;
    // console.log(svg.getScreenCTM());
    return pt.matrixTransform(svg.getScreenCTM().inverse());
}

function movePoint(event, edge) {
    // const edge = event.target;
    const point = getSVGPointer(event);
    edge.setAttribute("cx", point.x);
    edge.setAttribute("cy", point.y);
    // console.log(x, y, edge);
}

function drawBezierLine() { // You need to generalize for n-th ordre Bezier curves.
    let points = "";
    const polyline = document.getElementById("bezier-curve");
    updateEdges();
    // console.log(startPoint, endPoint);
    points += startPoint.join(",") + " ";
    const step = 0.01;
    // const bLength = getBLengthEst();
    // const dl = R * bLength / 1000;
    // console.log("dl:", dl);
    for (let t = 0; t < 1; t += step) {
        points += bezier(t).join(",") + " ";
    }
    points += endPoint.join(",");
    polyline.setAttribute("points", points);
    moveToTop(document.getElementById("edge-start"));
    moveToTop(document.getElementById("edge-end"));
}

function moveToTop(e) { // FIXME This is reaaaaly bad;
    const svg = document.getElementById("svg-container");
    svg.removeChild(e);
    svg.append(e);
}

function updateEdges() {
    const start = document.getElementById("edge-start");
    const end = document.getElementById("edge-end");
    startPoint = [parseFloat(start.getAttribute("cx")), parseFloat(start.getAttribute("cy"))];
    endPoint = [parseFloat(end.getAttribute("cx")), parseFloat(end.getAttribute("cy"))];
}

function drawDashedLine(edge) {
    // console.log(edge);
    let edgeId = "";
    let edgeNum = parseInt(edge.id.substring(2));
    // console.log("num:", edgeNum);
    let edgeIndex = controls.indexOf(edgeNum);
    // console.log("i:", edgeIndex);
    if (controls.length === 0 || edgeIndex === 0) {
        edgeId = "edge-start";
    } else if (edgeIndex === -1) {
        edgeId = "c-" + controls[controls.length - 1];
    } else {
        edgeId = "c-" + controls[edgeIndex - 1];
    }
    // console.log(controls, "prev:", edgeId);
    const previous = document.getElementById(edgeId);
    if (edgeIndex === -1 || edgeIndex === controls.length - 1) {
        edgeId = "edge-end";
    } else {
        edgeId = "c-" + controls[edgeIndex + 1];
    }
    // console.log(controls, "next:", edgeId);
    const next = document.getElementById(edgeId);
    const firstLine = document.getElementById(previous.id + "-" + edge.id);
    const lastLine = document.getElementById(edge.id + "-" + next.id);
    // console.log("p-n:", previous, next);
    drawLine(previous, edge, firstLine ? firstLine.id : "");
    drawLine(edge, next, lastLine ? lastLine.id : "");
}

function drawLine(a, b, lineId = "") { // dashed by default, you may add a params object later on...
    // console.trace();
    let polyline;
    if (lineId) {
        polyline = document.getElementById(lineId);
    } else {
        polyline = document.createElementNS(XMLNS, "line");
    }
    const svg = document.getElementById("svg-container");
    polyline.classList.add("dashed-bezier");
    polyline.id = a.id + "-" + b.id;
    const ac = [parseFloat(a.getAttribute("cx")), parseFloat(a.getAttribute("cy"))];
    const bc = [parseFloat(b.getAttribute("cx")), parseFloat(b.getAttribute("cy"))];
    const dx = bc[0] - ac[0];
    const dy = bc[1] - ac[1];
    let slope = dx === 0 ? 0 : 1 / Math.sqrt(1 + Math.pow(dy / dx, 2));
    aPoint = [ac[0] + Math.sign(dx) * R * slope, ac[1] + Math.sign(dy) * R * (Math.sqrt(1 - Math.pow(slope, 2)))]; // FIXME r instead of R?
    bPoint = [bc[0] - Math.sign(dx) * R * slope, bc[1] - Math.sign(dy) * R * (Math.sqrt(1 - Math.pow(slope, 2)))];
    // console.log(aPoint, bPoint);
    polyline.setAttribute("x1", aPoint[0]);
    polyline.setAttribute("y1", aPoint[1]);
    polyline.setAttribute("x2", bPoint[0]);
    polyline.setAttribute("y2", bPoint[1]);
    // polyline.setAttribute("points", (aPoint.join(",") + " " + bPoint.join(",")));
    // console.log(polyline);
    svg.append(polyline);
}

function getBLengthEst() {
    const m = d2(startPoint, endPoint);
    let l = 0, p, x, y;
    for (let i = 0; i < controls.length + 1; i++) {
        if (i === 0) {
            p = document.getElementById("c-" + controls[i]);
            x = [parseFloat(p.getAttribute("cx")), parseFloat(p.getAttribute("cx"))];
            l += d2(startPoint, x);
        } else if (i === controls.length) {
            p = document.getElementById("c-" + controls[i - 1]);
            y = [parseFloat(p.getAttribute("cx")), parseFloat(p.getAttribute("cx"))];
            l += d2(y, endPoint);
        } else {
            p = document.getElementById("c-" + controls[i - 1]);
            x = [parseFloat(p.getAttribute("cx")), parseFloat(p.getAttribute("cx"))];
            p = document.getElementById("c-" + controls[i]);
            y = [parseFloat(p.getAttribute("cx")), parseFloat(p.getAttribute("cx"))];
            l += d2(x, y);
        }
    }
    return (l + m) / 2;
}

function d2(x, y) {
    return Math.sqrt(Math.pow(x[0] - y[0], 2) + Math.pow(x[1] - y[1], 2));
}

function bezier(t) {
    const n = controls.length + 2;
    // console.log(startPoint, endPoint);
    let point, control, b = [0, 0];
    for (let i = 0; i < n; i++) {
        if (i === 0) {
            point = startPoint;
        } else if (i === n - 1) {
            point = endPoint;
        } else {
            control = document.getElementById("c-" + controls[i - 1]);
            point = [parseFloat(control.getAttribute("cx")), parseFloat(control.getAttribute("cy"))];
        }
        b[0] += binomial(n - 1, i) * Math.pow(t, i) * Math.pow(1 - t, n - 1 - i) * point[0];
        b[1] += binomial(n - 1, i) * Math.pow(t, i) * Math.pow(1 - t, n - 1 - i) * point[1];
    }
    return b;
}

function binomial(n, k) {
    let bin = 1;
    for (let i = 0; i < k; i++) {
        bin *= (n - i);
        bin /= i + 1;
    }
    return bin;
}

function addControl(event) {
    const svg = document.getElementById("svg-container");
    if (event.target.id !== "svg-container") {
        return;
    }
    const newControl = document.createElementNS(XMLNS, "circle");
    const point = getSVGPointer(event);
    newControl.setAttribute("cx", point.x); // FIXME Take care of overlapping points at this point!
    newControl.setAttribute("cy", point.y);
    newControl.classList.add("control-point");
    const newIndex = controls.length === 0 ? 0 : controls[controls.length - 1] + 1;
    newControl.id = "c-" + newIndex;
    newControl.setAttribute("r", r);
    newControl.addEventListener("mousedown", (event) => {
        if (event["buttons"] !== 1) {
            return;
        }
        const edge = event.target;
        eventListeners["document"]["movingPoint"] = (event) => {
            movePoint(event, edge);
            drawDashedLine(edge);
            drawBezierLine();
        }
        svg.addEventListener("mousemove", eventListeners["document"]["movingPoint"], false);
    }, false);
    newControl.addEventListener("mouseup", () => {
        svg.removeEventListener("mousemove", eventListeners["document"]["movingPoint"], false);
    }, false);
    if (newIndex > 0) {
        document.getElementById("c-" + (newIndex - 1) + "-edge-end").remove();
    }
    newControl.addEventListener("contextmenu", deleteControl, false);
    drawDashedLine(newControl);
    controls.push(newIndex);
    svg.append(newControl);
    drawBezierLine();
    // console.log(newControl);
}

function deleteControl(event) {
    event.preventDefault();
    const edge = event.target;
    const controlNum = parseInt(edge.id.substring(2));
    const controlIndex = controls.indexOf(controlNum);
    const prevId = controlIndex === 0 ? "edge-start" : "c-" + controls[controlIndex - 1];
    const nextId = controlNum === controls[controls.length - 1] ? "edge-end" : "c-" + controls[controlIndex + 1];
    // console.log(edge.id, prevId, nextId);
    document.getElementById(prevId + "-" + edge.id).remove();
    document.getElementById(edge.id + "-" + nextId).remove();
    if (controls.length > 1) {
        drawLine(document.getElementById(prevId), document.getElementById(nextId));
    }
    // console.log("before:", controls);
    controls.splice(controls.indexOf(controlNum), 1);
    // console.log("after:", controls);
    drawBezierLine();
    event.target.remove();
}

function main() {
    const start = document.getElementById("edge-start");
    const end = document.getElementById("edge-end");
    const svg = document.getElementById("svg-container");
    start.addEventListener("mousedown", (event) => {
        if (event["buttons"] !== 1) {
            return;
        }
        const edge = event.target;
        eventListeners["document"]["movingPoint"] = (event) => {
            movePoint(event, edge);
            if (controls.length > 0) {
                drawDashedLine(document.getElementById("c-" + controls[0]));
            }
            drawBezierLine();
        };
        svg.addEventListener("mousemove", eventListeners["document"]["movingPoint"], false);
    }, false);
    start.addEventListener("mouseup", () => {
        svg.removeEventListener("mousemove", eventListeners["document"]["movingPoint"], false);
    }, false);
    end.addEventListener("mousedown", (event) => {
        if (event["buttons"] !== 1) {
            return;
        }
        const edge = event.target;
        eventListeners["document"]["movingPoint"] = (event) => {
            movePoint(event, edge);
            if (controls.length > 0) {
                drawDashedLine(document.getElementById("c-" + controls[controls.length - 1]));
            }
            drawBezierLine();
        };
        svg.addEventListener("mousemove", eventListeners["document"]["movingPoint"], false);
    }, false);
    end.addEventListener("mouseup", () => {
        svg.removeEventListener("mousemove", eventListeners["document"]["movingPoint"], false);
    }, false);
    svg.addEventListener("click", addControl, false);
}

window.addEventListener("load", main, false);