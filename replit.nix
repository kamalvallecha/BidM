{
  description = "BidM Application";
  deps = [
    "python3"
    "nodejs"
    "postgresql"
    "yarn"
  ];
  env = {
    PYTHONPATH = "${REPL_HOME}/backend:${PYTHONPATH}";
    LD_LIBRARY_PATH = "${REPL_HOME}/backend:${LD_LIBRARY_PATH}";
  };
}