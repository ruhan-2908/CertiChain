package com.certichain.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.web3j.crypto.Credentials;
import org.web3j.protocol.Web3j;
import org.web3j.protocol.http.HttpService;
import org.web3j.tx.gas.ContractGasProvider;
import org.web3j.tx.gas.DefaultGasProvider;

@Configuration
public class Web3jConfig {

    @Bean
    public Web3j web3j(@Value("${certichain.blockchain.rpc-url:http://127.0.0.1:8545}") String rpcUrl) {
        return Web3j.build(new HttpService(rpcUrl.trim()));
    }

    @Bean
    public Credentials credentials(
            @Value("${certichain.blockchain.private-key}") String privateKey) {
        String trimmed = privateKey.trim();
        if (trimmed.startsWith("YOUR_") || trimmed.length() < 64) {
            throw new IllegalStateException("Invalid blockchain private key in certichain.blockchain.private-key");
        }
        return Credentials.create(trimmed);
    }

    @Bean
    public ContractGasProvider contractGasProvider() {
        return new DefaultGasProvider();
    }
}
