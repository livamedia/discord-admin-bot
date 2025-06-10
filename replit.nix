{ pkgs }: {
    deps = [
        pkgs.nodejs-18_x
        pkgs.python3
        pkgs.nodePackages.typescript-language-server
        pkgs.yarn
        pkgs.replitPackages.jest
    ];
} 