import type { IconType } from 'react-icons';
import {
  SiPython,
  SiSap,
  SiMysql,
  SiReact,
  SiLaravel,
  SiArduino,
  SiPandas,
  SiNumpy,
  SiScikitlearn,
  SiPlotly,
  SiScipy,
  SiScilab,
  SiQgis,
  SiDocker,
  SiGit,
  SiGithub,
  SiLatex,
  SiJupyter,
  SiAnaconda,
  SiJavascript,
  SiTypescript,
  SiHtml5,
  SiCss,
  SiTailwindcss,
  SiNodedotjs,
  SiPostgresql,
  SiMongodb,
  SiLinux,
  SiR,
  SiNotion,
  SiTrello,
  SiJira,
  SiFigma,
  SiBlender,
  SiAutodesk,
  SiGnubash,
  SiPhp,
  SiSqlite,
  SiFastapi,
  SiFlask,
  SiDjango,
  SiStreamlit,
  SiKeras,
  SiTensorflow,
  SiPytorch,
  SiOpencv,
} from 'react-icons/si';
import { FaFileExcel, FaJava, FaMicrosoft, FaWindows, FaDatabase, FaRobot, FaTruck, FaNetworkWired } from 'react-icons/fa6';
import {
  TbChartHistogram,
  TbCalendarStats,
  TbSettingsAutomation,
  TbTopologyStar3,
  TbChartAreaLine,
  TbMathFunction,
  TbCube3dSphere,
  TbFileCode,
  TbVectorBezier,
  TbBuildingFactory2,
  TbRoute,
  TbBinaryTree,
  TbChartBar,
  TbChartPie,
  TbChartDots3,
  TbBrandGoogleAnalytics,
  TbPresentation,
  TbTruckDelivery,
  TbPackages,
  TbBuildingWarehouse,
  TbClipboardData,
  TbTimeline,
  TbGitBranch,
  TbDatabase,
  TbCpu,
  TbDeviceDesktopAnalytics,
  TbBrain,
  TbAtom,
  TbCircuitResistor,
  TbRulerMeasure,
  TbTools,
  TbGauge,
  TbTarget,
  TbStack2,
  TbRecycle,
  TbLeaf,
  TbShieldCheck,
  TbCurrencyDollar,
  TbUsersGroup,
  TbBulb,
  TbBook,
  TbWorld,
  TbCode,
  TbTerminal2,
  TbApi,
  TbCloud,
  TbLock,
  TbChartCandle,
  TbMap2,
  TbDrone,
} from 'react-icons/tb';

/**
 * The icon library offered in the admin's skill editor.
 *
 * Skills are stored in the config by a stable string key, not by importing a
 * component — so the JSON stays serialisable and the admin can pick visually.
 * `keywords` only drives the picker's search box.
 */
export interface IconEntry {
  key: string;
  Icon: IconType;
  label: string;
  keywords: string;
}

export const ICONS: IconEntry[] = [
  // ---- languages & core dev ----
  { key: 'python', Icon: SiPython, label: 'Python', keywords: 'python code language' },
  { key: 'java', Icon: FaJava, label: 'Java', keywords: 'java jvm' },
  { key: 'javascript', Icon: SiJavascript, label: 'JavaScript', keywords: 'javascript js' },
  { key: 'typescript', Icon: SiTypescript, label: 'TypeScript', keywords: 'typescript ts' },
  { key: 'php', Icon: SiPhp, label: 'PHP', keywords: 'php' },
  { key: 'r', Icon: SiR, label: 'R', keywords: 'r stats statistics' },
  { key: 'bash', Icon: SiGnubash, label: 'Bash', keywords: 'bash shell terminal' },
  { key: 'html', Icon: SiHtml5, label: 'HTML', keywords: 'html markup web' },
  { key: 'css', Icon: SiCss, label: 'CSS', keywords: 'css style web' },
  { key: 'code', Icon: TbCode, label: 'Code (generic)', keywords: 'code generic programming' },
  { key: 'terminal', Icon: TbTerminal2, label: 'Terminal', keywords: 'terminal cli shell' },
  { key: 'filecode', Icon: TbFileCode, label: 'Script / VBA', keywords: 'vba macro script file code' },

  // ---- frameworks ----
  { key: 'react', Icon: SiReact, label: 'React', keywords: 'react frontend' },
  { key: 'laravel', Icon: SiLaravel, label: 'Laravel', keywords: 'laravel php backend' },
  { key: 'node', Icon: SiNodedotjs, label: 'Node.js', keywords: 'node backend javascript' },
  { key: 'django', Icon: SiDjango, label: 'Django', keywords: 'django python web' },
  { key: 'flask', Icon: SiFlask, label: 'Flask', keywords: 'flask python web' },
  { key: 'fastapi', Icon: SiFastapi, label: 'FastAPI', keywords: 'fastapi python api' },
  { key: 'streamlit', Icon: SiStreamlit, label: 'Streamlit', keywords: 'streamlit dashboard python' },
  { key: 'tailwind', Icon: SiTailwindcss, label: 'Tailwind', keywords: 'tailwind css' },
  { key: 'api', Icon: TbApi, label: 'API', keywords: 'api rest integration' },

  // ---- data & ML ----
  { key: 'pandas', Icon: SiPandas, label: 'Pandas', keywords: 'pandas dataframe python data' },
  { key: 'numpy', Icon: SiNumpy, label: 'NumPy', keywords: 'numpy array math' },
  { key: 'scipy', Icon: SiScipy, label: 'SciPy', keywords: 'scipy scientific' },
  { key: 'sklearn', Icon: SiScikitlearn, label: 'scikit-learn', keywords: 'sklearn machine learning ml' },
  { key: 'tensorflow', Icon: SiTensorflow, label: 'TensorFlow', keywords: 'tensorflow deep learning' },
  { key: 'pytorch', Icon: SiPytorch, label: 'PyTorch', keywords: 'pytorch deep learning' },
  { key: 'keras', Icon: SiKeras, label: 'Keras', keywords: 'keras deep learning' },
  { key: 'opencv', Icon: SiOpencv, label: 'OpenCV', keywords: 'opencv vision image' },
  { key: 'plotly', Icon: SiPlotly, label: 'Plotly', keywords: 'plotly chart viz' },
  { key: 'jupyter', Icon: SiJupyter, label: 'Jupyter', keywords: 'jupyter notebook' },
  { key: 'anaconda', Icon: SiAnaconda, label: 'Anaconda', keywords: 'anaconda conda python' },
  { key: 'ml', Icon: TbBinaryTree, label: 'Machine Learning', keywords: 'machine learning ml tree model' },
  { key: 'brain', Icon: TbBrain, label: 'AI / Deep learning', keywords: 'ai brain neural deep' },
  { key: 'analytics', Icon: TbDeviceDesktopAnalytics, label: 'Analytics', keywords: 'analytics dashboard' },
  { key: 'ganalytics', Icon: TbBrandGoogleAnalytics, label: 'Web analytics', keywords: 'google analytics traffic' },
  { key: 'clipboarddata', Icon: TbClipboardData, label: 'Data collection', keywords: 'data survey collection' },

  // ---- BI, charts, office ----
  { key: 'powerbi', Icon: TbChartHistogram, label: 'Power BI', keywords: 'power bi dashboard chart histogram' },
  { key: 'excel', Icon: FaFileExcel, label: 'Excel', keywords: 'excel spreadsheet microsoft' },
  { key: 'microsoft', Icon: FaMicrosoft, label: 'Microsoft 365', keywords: 'microsoft office 365' },
  { key: 'windows', Icon: FaWindows, label: 'Windows', keywords: 'windows os' },
  { key: 'chartbar', Icon: TbChartBar, label: 'Bar chart', keywords: 'chart bar report' },
  { key: 'chartpie', Icon: TbChartPie, label: 'Pie chart', keywords: 'chart pie share' },
  { key: 'chartarea', Icon: TbChartAreaLine, label: 'Risk / area chart', keywords: 'risk montecarlo area chart @risk' },
  { key: 'chartdots', Icon: TbChartDots3, label: 'Scatter / regression', keywords: 'scatter regression correlation' },
  { key: 'chartcandle', Icon: TbChartCandle, label: 'Finance', keywords: 'finance candle trading' },
  { key: 'presentation', Icon: TbPresentation, label: 'Presentation', keywords: 'presentation powerpoint slides' },

  // ---- supply chain & industry ----
  { key: 'sap', Icon: SiSap, label: 'SAP', keywords: 'sap erp s4hana' },
  { key: 'msproject', Icon: TbCalendarStats, label: 'MS Project', keywords: 'ms project planning gantt schedule' },
  { key: 'automation', Icon: TbSettingsAutomation, label: 'Power Automate', keywords: 'power automate rpa workflow' },
  { key: 'simulation', Icon: TbTopologyStar3, label: 'Simulation', keywords: 'simul8 simulation network discrete event' },
  { key: 'milp', Icon: TbRoute, label: 'Optimization / MILP', keywords: 'milp optimization operations research routing' },
  { key: 'lean', Icon: TbBuildingFactory2, label: 'Lean / VSM', keywords: 'lean vsm factory industrial kaizen' },
  { key: 'warehouse', Icon: TbBuildingWarehouse, label: 'Warehousing', keywords: 'warehouse wms storage' },
  { key: 'logistics', Icon: TbTruckDelivery, label: 'Logistics', keywords: 'logistics transport delivery truck' },
  { key: 'truck', Icon: FaTruck, label: 'Transport', keywords: 'truck freight transport' },
  { key: 'packages', Icon: TbPackages, label: 'Inventory', keywords: 'inventory stock packages' },
  { key: 'timeline', Icon: TbTimeline, label: 'Scheduling', keywords: 'schedule timeline sequencing' },
  { key: 'gauge', Icon: TbGauge, label: 'KPI / performance', keywords: 'kpi performance gauge metric' },
  { key: 'target', Icon: TbTarget, label: 'Six Sigma', keywords: 'six sigma quality target dmaic' },
  { key: 'stack', Icon: TbStack2, label: 'MRP / planning', keywords: 'mrp planning stack layers' },
  { key: 'recycle', Icon: TbRecycle, label: 'Circular economy', keywords: 'circular recycle reverse logistics' },
  { key: 'leaf', Icon: TbLeaf, label: 'Sustainability', keywords: 'sustainability green esg carbon' },
  { key: 'shield', Icon: TbShieldCheck, label: 'Quality / HSE', keywords: 'quality safety hse compliance' },
  { key: 'cost', Icon: TbCurrencyDollar, label: 'Cost / finance', keywords: 'cost finance budget pricing' },
  { key: 'network', Icon: FaNetworkWired, label: 'Network design', keywords: 'network supply design nodes' },
  { key: 'map', Icon: TbMap2, label: 'Geo / mapping', keywords: 'map gis geography route' },
  { key: 'qgis', Icon: SiQgis, label: 'QGIS', keywords: 'qgis gis mapping' },

  // ---- engineering & CAD ----
  { key: 'solidworks', Icon: TbCube3dSphere, label: 'SolidWorks / CAD', keywords: 'solidworks cad 3d modelling' },
  { key: 'autodesk', Icon: SiAutodesk, label: 'Autodesk', keywords: 'autocad autodesk cad' },
  { key: 'blender', Icon: SiBlender, label: 'Blender', keywords: 'blender 3d render' },
  { key: 'illustrator', Icon: TbVectorBezier, label: 'Illustrator / vector', keywords: 'illustrator vector design bezier' },
  { key: 'figma', Icon: SiFigma, label: 'Figma', keywords: 'figma design ui' },
  { key: 'arduino', Icon: SiArduino, label: 'Arduino', keywords: 'arduino electronics embedded' },
  { key: 'circuit', Icon: TbCircuitResistor, label: 'Electronics', keywords: 'electronics circuit resistor' },
  { key: 'cpu', Icon: TbCpu, label: 'Embedded', keywords: 'cpu embedded microcontroller' },
  { key: 'robot', Icon: FaRobot, label: 'Robotics', keywords: 'robot robotics automation' },
  { key: 'drone', Icon: TbDrone, label: 'Drone', keywords: 'drone uav' },
  { key: 'matlab', Icon: TbMathFunction, label: 'MATLAB / maths', keywords: 'matlab math function equation' },
  { key: 'scilab', Icon: SiScilab, label: 'Scilab', keywords: 'scilab numeric' },
  { key: 'ruler', Icon: TbRulerMeasure, label: 'Metrology', keywords: 'measure metrology tolerance' },
  { key: 'atom', Icon: TbAtom, label: 'Physics', keywords: 'physics atom science' },
  { key: 'tools', Icon: TbTools, label: 'Maintenance', keywords: 'maintenance tools tpm' },

  // ---- databases & infra ----
  { key: 'mysql', Icon: SiMysql, label: 'MySQL', keywords: 'mysql sql database' },
  { key: 'postgres', Icon: SiPostgresql, label: 'PostgreSQL', keywords: 'postgres sql database' },
  { key: 'sqlite', Icon: SiSqlite, label: 'SQLite', keywords: 'sqlite database' },
  { key: 'mongodb', Icon: SiMongodb, label: 'MongoDB', keywords: 'mongo nosql database' },
  { key: 'database', Icon: TbDatabase, label: 'Database (generic)', keywords: 'database sql data store' },
  { key: 'dbalt', Icon: FaDatabase, label: 'Data warehouse', keywords: 'warehouse data lake' },
  { key: 'docker', Icon: SiDocker, label: 'Docker', keywords: 'docker container' },
  { key: 'cloud', Icon: TbCloud, label: 'Cloud', keywords: 'cloud aws azure' },
  { key: 'linux', Icon: SiLinux, label: 'Linux', keywords: 'linux unix os' },
  { key: 'git', Icon: SiGit, label: 'Git', keywords: 'git version control' },
  { key: 'github', Icon: SiGithub, label: 'GitHub', keywords: 'github repository' },
  { key: 'gitbranch', Icon: TbGitBranch, label: 'Version control', keywords: 'branch git workflow' },
  { key: 'lock', Icon: TbLock, label: 'Security', keywords: 'security lock cyber' },

  // ---- work & soft ----
  { key: 'latex', Icon: SiLatex, label: 'LaTeX', keywords: 'latex overleaf typesetting' },
  { key: 'notion', Icon: SiNotion, label: 'Notion', keywords: 'notion notes docs' },
  { key: 'trello', Icon: SiTrello, label: 'Trello', keywords: 'trello kanban board' },
  { key: 'jira', Icon: SiJira, label: 'Jira', keywords: 'jira agile ticket' },
  { key: 'team', Icon: TbUsersGroup, label: 'Teamwork', keywords: 'team people collaboration' },
  { key: 'idea', Icon: TbBulb, label: 'Innovation', keywords: 'idea innovation bulb' },
  { key: 'book', Icon: TbBook, label: 'Research', keywords: 'book research study' },
  { key: 'world', Icon: TbWorld, label: 'International', keywords: 'world global international' },
];

export const ICON_MAP: Record<string, IconType> = Object.fromEntries(ICONS.map((i) => [i.key, i.Icon]));

/** Resolve a stored key to a component, with a safe fallback. */
export function resolveIcon(key: string): IconType {
  return ICON_MAP[key] ?? TbCode;
}

export function searchIcons(query: string): IconEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return ICONS;
  return ICONS.filter((i) => i.label.toLowerCase().includes(q) || i.keywords.includes(q) || i.key.includes(q));
}
