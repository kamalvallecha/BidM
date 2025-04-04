{ pkgs }: {
  description = "BidM Application";
  deps = [
    pkgs.python3
    pkgs.nodejs-20_x
    "postgresql"
    "yarn"
  ];
  env = {
    PYTHONPATH = "./backend:$PYTHONPATH";
    LD_LIBRARY_PATH = "./backend:$LD_LIBRARY_PATH";
  };
}