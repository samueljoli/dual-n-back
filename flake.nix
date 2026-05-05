{
  description = "Dual n-back desktop app";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs { inherit system; };
      in
      {
        devShells.default = pkgs.mkShell {
          packages = with pkgs; [
            cargo
            cargo-tauri
            just
            nodejs_24
            rustc
            rustfmt
          ];

          shellHook = ''
            echo "dual_n_back dev shell"
            echo "  npm install"
            echo "  just"
            echo "  npm run tauri dev"
          '';
        };
      });
}
