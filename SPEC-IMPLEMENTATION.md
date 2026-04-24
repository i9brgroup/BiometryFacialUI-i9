Voce ira implementar as seguintes funcionalidades no sistema:
- A funcionalidade a seguir sera para gerenciar o estado de ativo e inativo de logins de usuarios do sistema.
- No backend ja esta tudo implementado e testado, porem voce deve analisar o codigo e implementar a funcionalidade no frontend.

Segue abaixo o contrato da api que voce ira implementar:

    @PatchMapping("/{id}/toggle-status")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ActivateStatusResponse> deleteById(@PathVariable Long id) {
        var result = userService.activateAndDeactivateUser(id);

        return ResponseEntity.ok().body(new ActivateStatusResponse(result, result ? "Usuário ativado." : "Usuário desativado."));
    }

A rota so sera acessivel para usuarios com o papel de SUPER_ADMIN. Assim tambem o botao em que leva para essa rota sera visivel apenas para usuarios com o papel de SUPER_ADMIN.

Em relacao ao frontend, voce deve implementar a funcionalidade em dois lugares:

1. Voce criara uma pagina e substituira o botao do sidebar que atualmente é "Configuracoes" e ira substituir por um dropdown com as opcoes:
- Criar novo usuario
    Voce deve utilizar a mesma estrutura e interface de formulario que ja existe
- Gerenciar usuarios (lista de usuarios)
    Voce ira criar uma pagina que ira listar todos os usuarios do sistema.
    O endpoint sera:
        "/api/v1/users/list-users"
    O contrato da API sera:
        @GetMapping("/list-users")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<Page<ListUserResponse>> getFilteredUsers(
            @RequestParam(defaultValue = "0") Integer page,
            @RequestParam(defaultValue = "10") Integer size,
            @RequestParam(defaultValue = "id") String orderBy,
            @RequestParam(defaultValue = "ASC") String direction) {
        var usersPage = userService.getAllUsersPageable(page, size, orderBy, direction);
        return ResponseEntity.ok().body(usersPage);
    }

    O retorno da api sera algo parecido com:
        "content": [
        {
            "id": 1,
            "username": "Junior Teste",
            "email": "jrjunior@hotmail.com",
            "password": "$2a$12$d6t7fl0WVykkqnLhMevDLeMWpDk9969.30kKwyl6oOOPA1ZIxJdde",
            "createdAt": [
                2026,
                2,
                26,
                16,
                7,
                10,
                486666700
            ],
            "siteId": "SITE01",
            "role": "SUPER_ADMIN",
            "ativo": false
        },
        {
            "id": 2,
            "username": "Junior Oliveira",
            "email": "junior@hotmail.com",
            "password": "$2a$10$0cNaBwsgOixepnAuthXLTe6co3D0YHAn94aMlotqDtQC5Iv08jH/q",
            "createdAt": [
                2026,
                2,
                26,
                16,
                51,
                12,
                362642500
            ],
            "siteId": "SZNGRP",
            "role": "SUPER_ADMIN",
            "ativo": true
        },
        {
            "id": 3,
            "username": "Junior Default",
            "email": "default@hotmail.com",
            "password": "$2a$10$01e0RQuoBor2Uw310K2tieCD82Zf0z.lNDI9Ui9m6IC.M5wycLuZC",
            "createdAt": [
                2026,
                3,
                20,
                10,
                3,
                6,
                408236500
            ],
            "siteId": "DEFAULT",
            "role": "SUPER_ADMIN",
            "ativo": true
        },
        {
            "id": 4,
            "username": "Junior Default 2",
            "email": "default2@hotmail.com",
            "password": "$2a$10$eLwkgQAANpYtRlV5tcH0iuqRa1o4lgIJjMY2zFJLd6.NICogDKIba",
            "createdAt": [
                2026,
                4,
                23,
                14,
                24,
                28,
                141296000
            ],
            "siteId": "DEFAULT",
            "role": "SUPER_ADMIN",
            "ativo": true
        }
    ],
    "pageable": {
        "pageNumber": 0,
        "pageSize": 10,
        "sort": {
            "empty": false,
            "sorted": true,
            "unsorted": false
        },
        "offset": 0,
        "paged": true,
        "unpaged": false
    },
    "last": true,
    "totalPages": 1,
    "totalElements": 4,
    "size": 10,
    "number": 0,
    "sort": {
        "empty": false,
        "sorted": true,
        "unsorted": false
    },
    "first": true,
    "numberOfElements": 4,
    "empty": false
}

Ao entrar na rota de listar usuarios, os dados deve ser carregados dinamicamente em uma tabela, onde cada linha deve ter um botao:
- Ativar/Desativar: Para ativar/desativar o usuario. Se o usuario estiver ativo, o botao deve mostrar "Desativar". Se o usuario estiver desativado, o botao deve mostrar "Ativar".

Ao clicar em desativar/ativar, deve ser aberto um modal para confirmar a desativacao/ativacao. O modal deve ter os dados do usuario para confirmacao e deve seguir a regra de negocio do endpoint /toggle-status.

Traga as informacoes dos usuarios em formato de tabela, seguindo o padrao de interface utilizado no sistema.

Na informacao de data de criacao, converta para o formato brasileiro (dd/MM/yyyy HH:mm).
É devolvido isso:
    "createdAt": [
                2026,
                2,
                26,
                16,
                7,
                10,
                486666700
            ],
    Isso deve ser convertido para:
        26/02/2026 16:07

Importante:
- Não tera a opcao de editar os usuarios. tera apenas a opcao de ativar/desativar.
- As configuracoes de rota segura e tokens devem seguir o padrão que ja existe no sistema.
- A pagina de listagem de usuarios deve ser acessivel apenas para usuarios com o papel de SUPER_ADMIN.
- A pagina de criar novo usuario deve ser acessivel apenas para usuarios com o papel de SUPER_ADMIN.